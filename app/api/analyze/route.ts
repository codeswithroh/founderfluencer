import { NextRequest, NextResponse } from "next/server";
import { getUserInfo, getLastTweets } from "@/lib/twitter";
import { getUserInfoScrapingdog, getLastTweetsScrapingdog } from "@/lib/twitter-scrapingdog";
import { getUserInfoSyndication, getLastTweetsSyndication } from "@/lib/twitter-syndication";
import { analyzeFounderWithIdeas } from "@/lib/openrouter";
import { AnalysisResult, DataSource } from "@/types";

const cache = new Map<string, AnalysisResult>();

type ProfileResult = Awaited<ReturnType<typeof getUserInfo>>;
type TweetResult   = Awaited<ReturnType<typeof getLastTweets>>;

async function tryLayer(
  label: string,
  getProfile: () => Promise<ProfileResult>,
  getTweets:  (userName: string) => Promise<TweetResult>,
  userName: string
): Promise<{ profile: ProfileResult; tweets: TweetResult } | null> {
  try {
    const profile = await getProfile();
    if (!profile) return null;
    let tweets: TweetResult = [];
    try { tweets = await getTweets(userName); } catch {}
    console.info(`[foundrproof] ${label} succeeded for @${userName}`);
    return { profile, tweets };
  } catch (err: any) {
    console.warn(`[foundrproof] ${label} failed:`, err.message);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();
    if (!username || typeof username !== "string") {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const clean = username.replace(/^@/, "").trim().toLowerCase();
    if (!clean) {
      return NextResponse.json({ error: "Invalid username" }, { status: 400 });
    }

    const cached = cache.get(clean);
    if (cached) return NextResponse.json(cached);

    // ── Layer 1: twitterapi.io ────────────────────────────────────────────────
    let result = await tryLayer(
      "twitterapi.io",
      () => getUserInfo(clean),
      (u) => getLastTweets(u),
      clean
    );
    let dataSource: DataSource = "live";

    // ── Layer 2: Scrapingdog (only if SCRAPINGDOG_API_KEY is set) ─────────────
    if (!result) {
      result = await tryLayer(
        "Scrapingdog",
        () => getUserInfoScrapingdog(clean),
        (u) => getLastTweetsScrapingdog(u),
        clean
      );
      dataSource = "syndication"; // reuse type — still real data
    }

    // ── Layer 3: Twitter Syndication (free, no auth) ──────────────────────────
    if (!result) {
      result = await tryLayer(
        "Syndication",
        () => getUserInfoSyndication(clean),
        (u) => getLastTweetsSyndication(u),
        clean
      );
      dataSource = "syndication";
    }

    // ── All scrapers exhausted ────────────────────────────────────────────────
    if (!result) {
      return NextResponse.json(
        {
          error:
            "Could not fetch Twitter data. The account may be private, suspended, or all data sources are temporarily unavailable. Please try again shortly.",
        },
        { status: 404 }
      );
    }

    const { profile, tweets } = result;
    if (!profile) throw new Error("Profile unexpectedly null");
    const analysis = await analyzeFounderWithIdeas({ ...profile }, tweets, clean);
    const final: AnalysisResult = { profile, tweets, analysis, dataSource };
    cache.set(clean, final);
    return NextResponse.json(final);

  } catch (error: any) {
    console.error("[foundrproof] analyze error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze user" },
      { status: 500 }
    );
  }
}
