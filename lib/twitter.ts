import { TwitterProfile, Tweet } from "@/types";

const BASE = "https://api.twitterapi.io";

function getHeaders(): Record<string, string> {
  const key = process.env.TWITTERAPI_IO_KEY;
  if (!key) throw new Error("TWITTERAPI_IO_KEY is not set in environment variables.");
  return { "x-api-key": key };
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
  const res = await apiFetch(`${BASE}/twitter/user/info?userName=${encodeURIComponent(userName)}`);

  if (res.status === 401 || res.status === 403) {
    throw new Error(`twitterapi.io auth failed (${res.status}): ${await readError(res)} — check TWITTERAPI_IO_KEY`);
  }
  if (res.status === 402) throw new Error("twitterapi.io credits exhausted — top up at twitterapi.io");
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`twitterapi.io error ${res.status}: ${await readError(res)}`);

  const json = await res.json();

  // Soft error returned as 200
  if (json.status === "error" || json.status === "fail") {
    const msg: string = json.msg || json.message || "unknown error";
    if (/not found|does not exist|no user/i.test(msg)) return null;
    throw new Error(`twitterapi.io: ${msg}`);
  }

  // Handle both { data: { id } } and flat { id } responses
  const data = json.data ?? json;
  if (!data?.id) {
    // Log the actual response shape to help debug future format changes
    console.warn("[twitterapi.io] unexpected response shape:", JSON.stringify(json).slice(0, 300));
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    userName: data.userName,
    followers: data.followers ?? data.followersCount ?? 0,
    following: data.following ?? data.followingCount ?? 0,
    favouritesCount: data.favouritesCount ?? data.likeCount ?? 0,
    statusesCount: data.statusesCount ?? data.tweetCount ?? 0,
    isBlueVerified: data.isBlueVerified ?? false,
    createdAt: data.createdAt ?? "",
    description: data.description ?? "",
    profilePicture: data.profilePicture ?? data.profileImageUrl ?? "",
    bannerPicture: data.coverPicture ?? data.bannerPicture ?? "",
    location: data.location ?? "",
    url: data.url ?? `https://x.com/${data.userName}`,
  };
}

export async function getLastTweets(userName: string): Promise<Tweet[]> {
  const res = await apiFetch(
    `${BASE}/twitter/user/last_tweets?userName=${encodeURIComponent(userName)}&includeReplies=false`
  );

  if (res.status === 401 || res.status === 403)
    throw new Error(`twitterapi.io auth failed (${res.status})`);
  if (res.status === 402) throw new Error("twitterapi.io credits exhausted");
  if (!res.ok) return [];

  const json = await res.json();
  if (json.status === "error" || json.status === "fail") return [];

  const tweets = json.data?.tweets ?? json.tweets ?? [];
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
