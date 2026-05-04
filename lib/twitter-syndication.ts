/**
 * Twitter Syndication fallback — Layer 2
 *
 * cdn.syndication.twimg.com/timeline/profile gets blocked from cloud IPs.
 * Instead we use two approaches:
 *  A) Twitter's oEmbed endpoint (always public, returns HTML we parse)
 *  B) Twitter's syndication tweet endpoint with known tweet IDs
 *
 * For profile data we use the oEmbed approach on the profile page.
 */

import { TwitterProfile, Tweet } from "@/types";

// Twitter oEmbed — public, no auth, works from any IP
// Returns rendered HTML of a tweet/profile embed
async function fetchOEmbed(username: string): Promise<string | null> {
  try {
    const url = `https://publish.twitter.com/oembed?url=${encodeURIComponent(
      `https://twitter.com/${username}`
    )}&omit_script=true`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; bot/1.0)" },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.html ?? null;
  } catch {
    return null;
  }
}

// Parse basic profile info out of oEmbed HTML snippet
// oEmbed HTML looks like:
// <blockquote>...<a href="https://twitter.com/USERNAME">Name</a>...
function parseOEmbedProfile(html: string, userName: string): TwitterProfile | null {
  try {
    // Extract display name — appears as link text before the @handle line
    const nameMatch = html.match(/—\s*(.*?)\s*\(@/);
    const displayName = nameMatch?.[1]?.trim() ?? userName;

    // Profile picture: <img src="..." style="...">
    const imgMatch = html.match(/src="(https:\/\/pbs\.twimg\.com\/profile_images[^"]+)"/);
    const pic = imgMatch?.[1] ?? "";

    // Bio / tweet text — content inside the blockquote
    const bioMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/);
    const bio = bioMatch?.[1]?.replace(/<[^>]+>/g, "").trim() ?? "";

    return {
      id: userName,
      name: displayName,
      userName,
      followers: 0,
      following: 0,
      favouritesCount: 0,
      statusesCount: 0,
      isBlueVerified: false,
      createdAt: "",
      description: bio,
      profilePicture: pic,
      bannerPicture: "",
      location: "",
      url: `https://x.com/${userName}`,
    };
  } catch {
    return null;
  }
}

// Parse tweets out of oEmbed HTML
function parseOEmbedTweets(html: string): Tweet[] {
  try {
    const textMatch = html.match(/<p[^>]*>([\s\S]*?)<\/p>/g) ?? [];
    const text = textMatch
      .map((p) => p.replace(/<[^>]+>/g, "").trim())
      .filter(Boolean)
      .join(" ");

    if (!text) return [];

    return [
      {
        id: "",
        text,
        likes: 0,
        retweets: 0,
        replies: 0,
        createdAt: "",
      },
    ];
  } catch {
    return [];
  }
}

export async function getUserInfoSyndication(
  userName: string
): Promise<TwitterProfile | null> {
  const html = await fetchOEmbed(userName);
  if (!html) return null;
  return parseOEmbedProfile(html, userName);
}

export async function getLastTweetsSyndication(userName: string): Promise<Tweet[]> {
  const html = await fetchOEmbed(userName);
  if (!html) return [];
  return parseOEmbedTweets(html);
}
