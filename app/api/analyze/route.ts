import { NextRequest, NextResponse } from "next/server";
import { getUserInfo, getLastTweets } from "@/lib/twitter";
import { getUserInfoSyndication, getLastTweetsSyndication } from "@/lib/twitter-syndication";
import { analyzeFounderWithIdeas } from "@/lib/openrouter";
import { AnalysisResult, DataSource } from "@/types";

const cache = new Map<string, AnalysisResult>();

// Collects what each layer tried and why it failed — returned in the error
// response so you can diagnose without needing server logs.
const layerLog: Record<string, string> = {};

async function tryLayer(
  label: string,
  getProfile: () => Promise<any>,
  getTweets: (u: string) => Promise<any[]>,
  userName: string
): Promise<{ profile: any; tweets: any[] } | null> {
  try {
    const profile = await getProfile();
    if (!profile) {
      layerLog[label] = "returned null (user not found or empty response)";
      return null;
    }
    let tweets: any[] = [];
    try {
      tweets = await getTweets(userName);
    } catch (tErr: any) {
      layerLog[label + "_tweets"] = tErr.message;
    }
    layerLog[label] = "OK";
    return { profile, tweets };
  } catch (err: any) {
    layerLog[label] = err.message;
    return null;
  }
}

export async function POST(req: NextRequest) {
  // Reset per-request log
  Object.keys(layerLog).forEach((k) => delete layerLog[k]);

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

    // ── Layer 2: Twitter Syndication API (free, no auth) ─────────────────────
    if (!result) {
      result = await tryLayer(
        "syndication",
        () => getUserInfoSyndication(clean),
        (u) => getLastTweetsSyndication(u),
        clean
      );
      dataSource = "syndication";
    }

    // ── All scrapers exhausted — return transparent error ─────────────────────
    if (!result) {
      console.error("[foundrproof] all layers failed:", layerLog);
      const creditsGone = Object.values(layerLog).some((v) => v.includes("credits exhausted"));
      return NextResponse.json(
        {
          error: creditsGone
            ? "twitterapi.io credits are exhausted — top up at twitterapi.io to restore full service."
            : "Could not fetch Twitter data. The account may be private or suspended.",
          debug: layerLog,
        },
        { status: 404 }
      );
    }

    const { profile, tweets } = result;
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
