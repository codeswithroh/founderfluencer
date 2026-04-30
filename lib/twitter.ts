import { TwitterProfile, Tweet } from "@/types";

const BASE = "https://api.twitterapi.io";
const HEADERS = {
  "x-api-key": process.env.TWITTERAPI_IO_KEY || "",
};

export async function getUserInfo(userName: string): Promise<TwitterProfile | null> {
  const res = await fetch(
    `${BASE}/twitter/user/info?userName=${encodeURIComponent(userName)}`,
    { headers: HEADERS, next: { revalidate: 60 } }
  );
  if (!res.ok) return null;
  const json = await res.json();
  const data = json.data || json;
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
    bannerPicture: data.bannerPicture,
    location: data.location,
    url: data.url,
  };
}

export async function getLastTweets(userName: string): Promise<Tweet[]> {
  const res = await fetch(
    `${BASE}/twitter/user/last_tweets?userName=${encodeURIComponent(userName)}&includeReplies=false`,
    { headers: HEADERS, next: { revalidate: 60 } }
  );
  if (!res.ok) return [];
  const json = await res.json();
  const tweets = json.data?.tweets || json.tweets || [];
  return tweets.slice(0, 15).map((t: any) => ({
    id: t.id,
    text: t.text,
    likes: t.likes || 0,
    retweets: t.retweets || 0,
    replies: t.replies || 0,
    impressions: t.impressions,
    createdAt: t.createdAt,
  }));
}

export async function getUserAbout(userName: string): Promise<Partial<TwitterProfile>> {
  const res = await fetch(
    `${BASE}/twitter/user_about?userName=${encodeURIComponent(userName)}`,
    { headers: HEADERS, next: { revalidate: 60 } }
  );
  if (!res.ok) return {};
  const json = await res.json();
  const data = json.data || json;
  return {
    description: data.description,
    location: data.location,
    url: data.url,
  };
}
