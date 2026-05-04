/**
 * socialdata.tools — Primary Twitter data source
 *
 * Endpoints:
 *   Profile : GET https://api.socialdata.tools/twitter/user/{username}
 *   Tweets  : GET https://api.socialdata.tools/twitter/user/{user_id}/tweets
 *
 * Auth: Authorization: Bearer {SOCIALDATA_API_KEY}
 * Pricing: $0.0002 per profile or tweet returned (~$0.20 per 1,000)
 * Sign up: https://socialdata.tools
 */

import { TwitterProfile, Tweet } from "@/types";

const BASE = "https://api.socialdata.tools";

function getHeaders(): Record<string, string> {
  const key = process.env.SOCIALDATA_API_KEY;
  if (!key) throw new Error("SOCIALDATA_API_KEY is not set in environment variables.");
  return {
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
  };
}

async function sdFetch(url: string): Promise<Response> {
  return fetch(url, { headers: getHeaders() });
}

async function readError(res: Response): Promise<string> {
  try {
    const j = await res.json();
    return j.message || j.error || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

export async function getUserInfoSocialdata(userName: string): Promise<TwitterProfile | null> {
  const res = await sdFetch(`${BASE}/twitter/user/${encodeURIComponent(userName)}`);

  if (res.status === 401 || res.status === 403) {
    throw new Error(`socialdata.tools auth failed (${res.status}) — check SOCIALDATA_API_KEY`);
  }
  if (res.status === 402) {
    throw new Error("socialdata.tools balance exhausted — top up at socialdata.tools");
  }
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`socialdata.tools error ${res.status}: ${await readError(res)}`);

  const u = await res.json();
  if (!u?.id_str) return null;

  return {
    id: u.id_str,
    name: u.name,
    userName: u.screen_name,
    followers: u.followers_count ?? 0,
    following: u.friends_count ?? 0,
    favouritesCount: u.favourites_count ?? 0,
    statusesCount: u.statuses_count ?? 0,
    isBlueVerified: u.verified ?? u.is_blue_verified ?? false,
    createdAt: u.created_at ?? "",
    description: u.description ?? "",
    profilePicture: (u.profile_image_url_https ?? "").replace("_normal", "_400x400"),
    bannerPicture: u.profile_banner_url ?? "",
    location: u.location ?? "",
    url: u.url ?? `https://x.com/${u.screen_name}`,
  };
}

export async function getLastTweetsSocialdata(userId: string): Promise<Tweet[]> {
  const res = await sdFetch(`${BASE}/twitter/user/${encodeURIComponent(userId)}/tweets`);

  if (res.status === 401 || res.status === 403) {
    throw new Error(`socialdata.tools auth failed (${res.status})`);
  }
  if (res.status === 402) throw new Error("socialdata.tools balance exhausted");
  if (!res.ok) return [];

  const json = await res.json();
  const tweets: any[] = json.tweets ?? [];

  return tweets.slice(0, 15).map((t: any) => ({
    id: t.id_str ?? "",
    text: t.full_text ?? t.text ?? "",
    likes: t.favorite_count ?? 0,
    retweets: t.retweet_count ?? 0,
    replies: t.reply_count ?? 0,
    impressions: t.views?.count ? Number(t.views.count) : undefined,
    createdAt: t.tweet_created_at ?? t.created_at ?? "",
  }));
}
