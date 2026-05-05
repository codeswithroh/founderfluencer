/**
 * GetXAPI — Twitter/X data layer (L2 fallback)
 *
 * Endpoints:
 *   Profile : GET https://api.getxapi.com/twitter/user/info?userName={username}
 *   Tweets  : GET https://api.getxapi.com/twitter/user/tweets?userName={username}
 *
 * Auth: Authorization: Bearer {GETXAPI_KEY}
 * Free: $0.1 credit at signup, no credit card — https://getxapi.com
 * Cost: $0.001 per call after free credits
 */

import { TwitterProfile, Tweet } from "@/types";

const BASE = "https://api.getxapi.com";

function getHeaders(): Record<string, string> {
  const key = process.env.GETXAPI_KEY;
  if (!key) throw new Error("GETXAPI_KEY is not set in environment variables.");
  return { Authorization: `Bearer ${key}` };
}

async function apiFetch(url: string, retries = 3): Promise<Response> {
  const headers = getHeaders();
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, { headers });
    if (res.status !== 429) return res;
    await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)));
  }
  return fetch(url, { headers: getHeaders() });
}

async function readError(res: Response): Promise<string> {
  try {
    const j = await res.json();
    return j.msg || j.message || j.error || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

export async function getUserInfo(userName: string): Promise<TwitterProfile | null> {
  const res = await apiFetch(
    `${BASE}/twitter/user/info?userName=${encodeURIComponent(userName)}`
  );

  if (res.status === 401 || res.status === 403)
    throw new Error(`getxapi auth failed (${res.status}) — check GETXAPI_KEY`);
  if (res.status === 402)
    throw new Error("getxapi credits exhausted — top up at getxapi.com");
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`getxapi error ${res.status}: ${await readError(res)}`);

  const json = await res.json();

  // Soft error returned as 200
  if (json.status === "error" || json.status === "fail") {
    const msg: string = json.msg || json.message || "unknown error";
    if (/not found|does not exist|no user/i.test(msg)) return null;
    throw new Error(`getxapi: ${msg}`);
  }

  // GetXAPI returns flat response; guard against unexpected shapes
  const data = json.data ?? json;
  if (!data?.id) {
    console.warn("[getxapi] unexpected response shape:", JSON.stringify(json).slice(0, 300));
    return null;
  }

  return {
    id: String(data.id),
    name: data.name,
    userName: data.userName,
    followers: data.followers ?? 0,
    following: data.following ?? 0,
    favouritesCount: data.favouritesCount ?? 0,
    statusesCount: data.statusesCount ?? 0,
    isBlueVerified: data.isBlueVerified ?? false,
    createdAt: data.createdAt ?? "",
    description: data.description ?? "",
    profilePicture: data.profilePicture ?? "",
    bannerPicture: data.coverPicture ?? data.bannerPicture ?? "",
    location: data.location ?? "",
    url: data.url ?? `https://x.com/${data.userName}`,
  };
}

export async function getLastTweets(userName: string): Promise<Tweet[]> {
  const res = await apiFetch(
    `${BASE}/twitter/user/tweets?userName=${encodeURIComponent(userName)}`
  );

  if (res.status === 401 || res.status === 403)
    throw new Error(`getxapi auth failed (${res.status})`);
  if (res.status === 402) throw new Error("getxapi credits exhausted");
  if (!res.ok) return [];

  const json = await res.json();
  if (json.status === "error" || json.status === "fail") return [];

  const tweets: any[] = json.tweets ?? json.data?.tweets ?? [];
  return tweets.slice(0, 15).map((t: any) => ({
    id: t.id ?? "",
    text: t.text ?? "",
    likes: t.likeCount ?? t.likes ?? 0,
    retweets: t.retweetCount ?? t.retweets ?? 0,
    replies: t.replyCount ?? t.replies ?? 0,
    impressions: t.viewCount ?? t.impressions,
    createdAt: t.createdAt ?? "",
  }));
}
