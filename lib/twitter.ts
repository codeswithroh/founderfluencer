import { TwitterProfile, Tweet } from "@/types";

const BASE = "https://api.twitterapi.io";

function getHeaders() {
  const key = process.env.TWITTERAPI_IO_KEY;
  if (!key) {
    throw new Error(
      "TWITTERAPI_IO_KEY is not configured. Please add it to your environment variables."
    );
  }
  return { "x-api-key": key };
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  const headers = getHeaders();
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(url, { headers, next: { revalidate: 60 } } as RequestInit);
    if (res.status !== 429) return res;
    // Exponential backoff: 1s, 2s, 4s
    await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
  }
  // Final attempt — return whatever we get
  const headers2 = getHeaders();
  return fetch(url, { headers: headers2, next: { revalidate: 60 } } as RequestInit);
}

async function parseErrorBody(res: Response): Promise<string> {
  try {
    const json = await res.json();
    // twitterapi.io error shapes: { msg }, { message }, { error }
    return json.msg || json.message || json.error || `HTTP ${res.status}`;
  } catch {
    return `HTTP ${res.status}`;
  }
}

export async function getUserInfo(userName: string): Promise<TwitterProfile | null> {
  const res = await fetchWithRetry(
    `${BASE}/twitter/user/info?userName=${encodeURIComponent(userName)}`
  );

  if (res.status === 401 || res.status === 403) {
    const msg = await parseErrorBody(res);
    throw new Error(`Twitter API authentication failed: ${msg}. Check your TWITTERAPI_IO_KEY.`);
  }

  if (res.status === 402) {
    throw new Error(
      "Twitter API credits exhausted. Please top up your twitterapi.io account."
    );
  }

  if (res.status === 404) {
    // Genuine user-not-found from the API
    return null;
  }

  if (!res.ok) {
    const msg = await parseErrorBody(res);
    throw new Error(`Twitter API error: ${msg}`);
  }

  const json = await res.json();

  // twitterapi.io may return { status: "error", msg: "..." } with a 200
  if (json.status === "error" || json.status === "fail") {
    const msg = json.msg || json.message || "User not found";
    // Treat soft "not found" responses as null, everything else as a thrown error
    if (/not found|does not exist|no user/i.test(msg)) return null;
    throw new Error(`Twitter API: ${msg}`);
  }

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

  if (res.status === 401 || res.status === 403) {
    const msg = await parseErrorBody(res);
    throw new Error(`Twitter API authentication failed: ${msg}`);
  }

  if (res.status === 402) {
    throw new Error("Twitter API credits exhausted.");
  }

  // Non-critical: missing tweets shouldn't abort the whole analysis
  if (!res.ok) return [];

  const json = await res.json();
  if (json.status === "error" || json.status === "fail") return [];

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
