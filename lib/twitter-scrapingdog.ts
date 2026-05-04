/**
 * Scrapingdog Twitter Scraper API — Layer 2 fallback
 *
 * Endpoint: GET https://api.scrapingdog.com/twitter/
 *   ?api_key=KEY&parsed=true&url=https://x.com/{username}
 *
 * Returns an array of tweets from the profile page.
 * Each tweet carries enough info to reconstruct a partial profile
 * (name, handle) plus full tweet engagement data.
 *
 * Env var: SCRAPINGDOG_API_KEY
 * Sign up for 1,000 free credits: https://api.scrapingdog.com/register
 */

import { TwitterProfile, Tweet } from "@/types";

const BASE = "https://api.scrapingdog.com/twitter/";

interface ScrapingdogTweet {
  name?: string;
  profile_handle?: string;
  profile_url?: string;
  tweet?: string;
  tweet_id?: string;
  tweet_date?: string;
  tweet_timing?: string;
  likes?: string;
  retweets?: string;
  views?: string;
  reply?: string;
  quotes?: string;
  bookmarks?: string;
}

/** "409.7k" → 409700, "1.8M" → 1800000, "3,528" → 3528 */
function parseCount(raw: string | undefined): number {
  if (!raw) return 0;
  const s = raw.replace(/,/g, "").trim().toLowerCase();
  const n = parseFloat(s);
  if (isNaN(n)) return 0;
  if (s.endsWith("k")) return Math.round(n * 1_000);
  if (s.endsWith("m")) return Math.round(n * 1_000_000);
  return Math.round(n);
}

async function fetchScrapingdog(userName: string): Promise<ScrapingdogTweet[] | null> {
  const key = process.env.SCRAPINGDOG_API_KEY;
  if (!key) return null; // not configured — skip silently

  const profileUrl = `https://x.com/${encodeURIComponent(userName)}`;
  const endpoint = `${BASE}?api_key=${encodeURIComponent(key)}&parsed=true&url=${encodeURIComponent(profileUrl)}`;

  try {
    const res = await fetch(endpoint, { cache: "force-cache" } as RequestInit);
    if (!res.ok) {
      console.warn(`Scrapingdog returned ${res.status} for @${userName}`);
      return null;
    }
    const json = await res.json();
    // Response is either an array directly, or { data: [...] }
    const tweets: ScrapingdogTweet[] = Array.isArray(json) ? json : json.data ?? [];
    return tweets.length > 0 ? tweets : null;
  } catch (err) {
    console.warn("Scrapingdog fetch error:", err);
    return null;
  }
}

export async function getUserInfoScrapingdog(
  userName: string
): Promise<TwitterProfile | null> {
  const tweets = await fetchScrapingdog(userName);
  if (!tweets) return null;

  // Profile info comes from any tweet authored by the target user
  const ownTweet = tweets.find(
    (t) =>
      t.profile_handle?.replace(/^@/, "").toLowerCase() === userName.toLowerCase()
  ) ?? tweets[0];

  if (!ownTweet?.name) return null;

  const handle = (ownTweet.profile_handle ?? `@${userName}`).replace(/^@/, "");

  return {
    id: handle,
    name: ownTweet.name,
    userName: handle,
    // Scrapingdog profile-page scrape doesn't expose follower/bio stats
    followers: 0,
    following: 0,
    favouritesCount: 0,
    statusesCount: 0,
    isBlueVerified: false,
    createdAt: "",
    description: "",
    profilePicture: "",
    bannerPicture: "",
    location: "",
    url: ownTweet.profile_url ?? `https://x.com/${handle}`,
  };
}

export async function getLastTweetsScrapingdog(userName: string): Promise<Tweet[]> {
  const tweets = await fetchScrapingdog(userName);
  if (!tweets) return [];

  return tweets
    .filter(
      (t) =>
        t.profile_handle?.replace(/^@/, "").toLowerCase() === userName.toLowerCase()
    )
    .slice(0, 15)
    .map((t) => ({
      id: t.tweet_id ?? "",
      text: t.tweet ?? "",
      likes: parseCount(t.likes),
      retweets: parseCount(t.retweets),
      replies: parseCount(t.reply),
      impressions: t.views ? parseCount(t.views) : undefined,
      createdAt: t.tweet_date ?? t.tweet_timing ?? "",
    }));
}
