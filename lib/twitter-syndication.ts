/**
 * Twitter Syndication API fallback
 *
 * cdn.syndication.twimg.com powers all "embedded timeline" widgets on the web.
 * It is public, requires no API key, and returns real tweet + user data.
 * We use it as Layer 2 when twitterapi.io is unavailable.
 *
 * Note: this is an unofficial but widely-used endpoint. It may return limited
 * follower/following counts and occasionally rate-limits by IP.
 */

import { TwitterProfile, Tweet } from "@/types";

const SYNDI_BASE = "https://cdn.syndication.twimg.com";

function syndiHeaders() {
  return {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept: "application/json, text/javascript, */*; q=0.01",
    "Accept-Language": "en-US,en;q=0.9",
    Referer: "https://platform.twitter.com/",
    Origin: "https://platform.twitter.com",
  };
}

interface SyndiTweet {
  type?: string;
  id_str?: string;
  full_text?: string;
  text?: string;
  favorite_count?: string | number;
  retweet_count?: string | number;
  reply_count?: string | number;
  created_at?: string;
  user?: SyndiUser;
}

interface SyndiUser {
  id_str?: string;
  name?: string;
  screen_name?: string;
  description?: string;
  followers_count?: number;
  friends_count?: number;
  favourites_count?: number;
  statuses_count?: number;
  verified?: boolean;
  is_blue_verified?: boolean;
  created_at?: string;
  profile_image_url_https?: string;
  profile_banner_url?: string;
  location?: string;
  url?: string;
}

async function fetchSyndication(userName: string): Promise<SyndiTweet[] | null> {
  try {
    // Cache-bust with a random seed so we don't get stale 304s
    const url = `${SYNDI_BASE}/timeline/profile?screen_name=${encodeURIComponent(
      userName
    )}&count=20&suppress_response_codes=true&rnd=${Math.random()}`;

    const res = await fetch(url, {
      headers: syndiHeaders(),
      // next-specific revalidate applied via cast
      cache: "force-cache",
    });

    if (!res.ok) return null;

    const json = await res.json();

    // The syndication response is wrapped in { body: [...] } or is an array directly
    const body: SyndiTweet[] = Array.isArray(json) ? json : json.body ?? [];
    return body.length > 0 ? body : null;
  } catch {
    return null;
  }
}

export async function getUserInfoSyndication(
  userName: string
): Promise<TwitterProfile | null> {
  const body = await fetchSyndication(userName);
  if (!body) return null;

  // User info lives inside the first tweet that carries a `.user` field
  const userRaw = body.find((item) => item.user)?.user;
  if (!userRaw) return null;

  return {
    id: userRaw.id_str ?? userName,
    name: userRaw.name ?? userName,
    userName: userRaw.screen_name ?? userName,
    followers: userRaw.followers_count ?? 0,
    following: userRaw.friends_count ?? 0,
    favouritesCount: userRaw.favourites_count ?? 0,
    statusesCount: userRaw.statuses_count ?? 0,
    isBlueVerified: userRaw.is_blue_verified ?? userRaw.verified ?? false,
    createdAt: userRaw.created_at ?? "",
    description: userRaw.description ?? "",
    profilePicture: userRaw.profile_image_url_https?.replace("_normal", "_400x400") ?? "",
    bannerPicture: userRaw.profile_banner_url ?? "",
    location: userRaw.location ?? "",
    url: userRaw.url ?? `https://x.com/${userName}`,
  };
}

export async function getLastTweetsSyndication(userName: string): Promise<Tweet[]> {
  const body = await fetchSyndication(userName);
  if (!body) return [];

  return body
    .filter((item) => item.type === "tweet" || item.id_str)
    .slice(0, 15)
    .map((t) => ({
      id: t.id_str ?? "",
      text: t.full_text ?? t.text ?? "",
      likes: Number(t.favorite_count ?? 0),
      retweets: Number(t.retweet_count ?? 0),
      replies: Number(t.reply_count ?? 0),
      impressions: undefined,
      createdAt: t.created_at ?? "",
    }));
}
