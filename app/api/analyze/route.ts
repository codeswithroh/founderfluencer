import { NextRequest, NextResponse } from "next/server";
import { getUserInfoSocialdata, getLastTweetsSocialdata } from "@/lib/twitter-socialdata";
import { getUserInfo, getLastTweets } from "@/lib/twitter";
import { getUserInfoSyndication, getLastTweetsSyndication } from "@/lib/twitter-syndication";
import { analyzeFounderWithIdeas } from "@/lib/openrouter";
import { AnalysisResult, DataSource } from "@/types";

const cache = new Map<string, AnalysisResult>();
const layerLog: Record<string, string> = {};

async function tryLayer(
  label: string,
  run: () => Promise<{ profile: any; tweets: any[] } | null>
): Promise<{ profile: any; tweets: any[] } | null> {
  try {
    const result = await run();
    if (!result) { layerLog[label] = "returned null"; return null; }
    layerLog[label] = "OK";
    return result;
  } catch (err: any) {
    layerLog[label] = err.message;
    return null;
  }
}

export async function POST(req: NextRequest) {
  Object.keys(layerLog).forEach((k) => delete layerLog[k]);

  try {
    const { username } = await req.json();
    if (!username || typeof username !== "string")
      return NextResponse.json({ error: "Username is required" }, { status: 400 });

    const clean = username.replace(/^@/, "").trim().toLowerCase();
    if (!clean)
      return NextResponse.json({ error: "Invalid username" }, { status: 400 });

    const cached = cache.get(clean);
    if (cached) return NextResponse.json(cached);

    let result = null;
    let dataSource: DataSource = "live";

    // ── L1: socialdata.tools (primary) ───────────────────────────────────────
    result = await tryLayer("socialdata.tools", async () => {
      const profile = await getUserInfoSocialdata(clean);
      if (!profile) return null;
      const tweets = await getLastTweetsSocialdata(profile.id).catch(() => []);
      return { profile, tweets };
    });

    // ── L2: twitterapi.io (fallback if TWITTERAPI_IO_KEY is set) ─────────────
    if (!result && process.env.TWITTERAPI_IO_KEY) {
      result = await tryLayer("twitterapi.io", async () => {
        const profile = await getUserInfo(clean);
        if (!profile) return null;
        const tweets = await getLastTweets(clean).catch(() => []);
        return { profile, tweets };
      });
    }

    // ── L3: oEmbed (free, no auth, partial data) ──────────────────────────────
    if (!result) {
      dataSource = "syndication";
      result = await tryLayer("oEmbed", async () => {
        const profile = await getUserInfoSyndication(clean);
        if (!profile) return null;
        const tweets = await getLastTweetsSyndication(clean).catch(() => []);
        return { profile, tweets };
      });
    }

    // ── All failed ────────────────────────────────────────────────────────────
    if (!result) {
      const creditsGone = Object.values(layerLog).some((v) => v.includes("exhausted"));
      console.error("[foundrproof] all layers failed:", layerLog);
      return NextResponse.json(
        {
          error: creditsGone
            ? "API credits exhausted — top up at socialdata.tools to restore service."
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
    return NextResponse.json({ error: error.message || "Failed to analyze user" }, { status: 500 });
  }
}
