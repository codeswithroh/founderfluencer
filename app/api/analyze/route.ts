import { NextRequest, NextResponse } from "next/server";
import { getUserInfo, getLastTweets } from "@/lib/twitter";
import { analyzeFounderWithIdeas } from "@/lib/openrouter";
import { AnalysisResult } from "@/types";

// In-memory cache keyed by lowercase username
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

    // Return cached result if we already analyzed this user
    const cached = cache.get(cleanUsername);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Fetch profile first, then tweets sequentially to avoid rate limiting
    const profile = await getUserInfo(cleanUsername);

    if (!profile) {
      return NextResponse.json(
        { error: "User not found or account is private" },
        { status: 404 }
      );
    }

    const tweets = await getLastTweets(cleanUsername);
    const enrichedProfile = { ...profile };

    const analysis = await analyzeFounderWithIdeas(enrichedProfile, tweets, cleanUsername);

    const result: AnalysisResult = {
      profile: enrichedProfile,
      tweets,
      analysis,
    };

    // Cache the result forever
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
