import { NextRequest, NextResponse } from "next/server";
import { getUserInfo, getLastTweets } from "@/lib/twitter";
import { getUserInfoSyndication, getLastTweetsSyndication } from "@/lib/twitter-syndication";
import { analyzeFounderWithIdeas, analyzeFounderBlindMode } from "@/lib/openrouter";
import { AnalysisResult, DataSource } from "@/types";

// ─── In-memory cache keyed by lowercase username ─────────────────────────────
const cache = new Map<string, AnalysisResult>();

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();
    if (!username || typeof username !== "string") {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const cleanUsername = username.replace(/^@/, "").trim().toLowerCase();
    if (!cleanUsername) {
      return NextResponse.json({ error: "Invalid username" }, { status: 400 });
    }

    // ── Serve from cache if available ─────────────────────────────────────────
    const cached = cache.get(cleanUsername);
    if (cached) return NextResponse.json(cached);

    // ── Layer 1: twitterapi.io (primary, paid) ────────────────────────────────
    let profile = null;
    let tweets: Awaited<ReturnType<typeof getLastTweets>> = [];
    let dataSource: DataSource = "live";

    try {
      profile = await getUserInfo(cleanUsername);
      if (profile) {
        try {
          tweets = await getLastTweets(cleanUsername);
        } catch (e: any) {
          console.warn("twitterapi.io tweets failed, continuing without:", e.message);
        }
      }
    } catch (primaryErr: any) {
      console.warn("twitterapi.io unavailable, trying syndication fallback:", primaryErr.message);
    }

    // ── Layer 2: Twitter Syndication API (free, no auth) ──────────────────────
    if (!profile) {
      dataSource = "syndication";
      try {
        profile = await getUserInfoSyndication(cleanUsername);
        if (profile) {
          tweets = await getLastTweetsSyndication(cleanUsername);
          console.info(`Syndication fallback succeeded for @${cleanUsername}`);
        }
      } catch (syndiErr: any) {
        console.warn("Syndication fallback failed:", syndiErr.message);
      }
    }

    // ── Layer 3: AI cold read (no external data) ──────────────────────────────
    if (!profile) {
      dataSource = "ai_only";
      console.info(`All Twitter sources failed — running AI cold read for @${cleanUsername}`);

      // Synthetic profile: enough for the UI to render (avatar shows initial, stats hidden)
      profile = {
        id: cleanUsername,
        name: cleanUsername,
        userName: cleanUsername,
        followers: 0,
        following: 0,
        favouritesCount: 0,
        statusesCount: 0,
        isBlueVerified: false,
        createdAt: new Date().toISOString(),
        description: "",
        profilePicture: "",
        bannerPicture: "",
        location: "",
        url: `https://x.com/${cleanUsername}`,
      };
      tweets = [];

      const analysis = await analyzeFounderBlindMode(cleanUsername);
      const result: AnalysisResult = { profile, tweets, analysis, dataSource };
      cache.set(cleanUsername, result);
      return NextResponse.json(result);
    }

    // ── Run AI analysis with whatever data we have ────────────────────────────
    const analysis = await analyzeFounderWithIdeas({ ...profile }, tweets, cleanUsername);
    const result: AnalysisResult = { profile, tweets, analysis, dataSource };
    cache.set(cleanUsername, result);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("Analyze error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze user" },
      { status: 500 }
    );
  }
}
