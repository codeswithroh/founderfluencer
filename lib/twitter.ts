import { TwitterProfile, Tweet } from "@/types";

const BASE = "https://api.twitterapi.io";
const HEADERS = {
  "x-api-key": process.env.TWITTERAPI_IO_KEY || "",
};

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(url, { headers: HEADERS, next: { revalidate: 60 } });
    if (res.status !== 429) return res;
    // Exponential backoff: 1s, 2s, 4s
    await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
  }
  // Final attempt — return whatever we get
  return fetch(url, { headers: HEADERS, next: { revalidate: 60 } });
}

export async function getUserInfo(userName: string): Promise<TwitterProfile | null> {
  const res = await fetchWithRetry(
    `${BASE}/twitter/user/info?userName=${encodeURIComponent(userName)}`
  );
  if (!res.ok) return null;
  const json = await res.json();
  const data = json.data || json;
  if (!data?.id) return null;
  return {
    id: data.id,
    name: data.name,
    userName: data.userName,
    followers: data.followers,
    following: data.following,
    favouritesCount: data.favouritesCount,
    statusesCount: data.statusesCount,
    isBlueVerified: data.isBlueVerified,
    createdAt: data.createdAt,
    description: data.description,
    profilePicture: data.profilePicture,
    bannerPicture: data.coverPicture || data.bannerPicture,
    location: data.location,
    url: data.url,
  };
}

export async function getLastTweets(userName: string): Promise<Tweet[]> {
  const res = await fetchWithRetry(
    `${BASE}/twitter/user/last_tweets?userName=${encodeURIComponent(userName)}&includeReplies=false`
  );
  if (!res.ok) return [];
  const json = await res.json();
  const tweets = json.data?.tweets || json.tweets || [];
  return tweets.slice(0, 15).map((t: any) => ({
    id: t.id,
    text: t.text,
    likes: t.likeCount ?? t.likes ?? 0,
    retweets: t.retweetCount ?? t.retweets ?? 0,
    replies: t.replyCount ?? t.replies ?? 0,
    impressions: t.viewCount ?? t.impressions,
    createdAt: t.createdAt,
  }));
}
