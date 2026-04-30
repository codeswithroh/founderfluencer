import { NextRequest, NextResponse } from "next/server";
import { getUserInfo, getLastTweets, getUserAbout } from "@/lib/twitter";
import { analyzeFounderWithIdeas } from "@/lib/openrouter";

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json();
    if (!username || typeof username !== "string") {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const cleanUsername = username.replace(/^@/, "").trim();
    if (!cleanUsername) {
      return NextResponse.json({ error: "Invalid username" }, { status: 400 });
    }

    // Fetch profile and tweets in parallel
    const [profile, tweets, about] = await Promise.all([
      getUserInfo(cleanUsername),
      getLastTweets(cleanUsername),
      getUserAbout(cleanUsername),
    ]);

    if (!profile) {
      return NextResponse.json(
        { error: "User not found or account is private" },
        { status: 404 }
      );
    }

    // Merge about data into profile
    const enrichedProfile = { ...profile, ...about };

    // Analyze with OpenRouter
    const analysis = await analyzeFounderWithIdeas(enrichedProfile, tweets);

    return NextResponse.json({
      profile: enrichedProfile,
      tweets,
      analysis,
    });
  } catch (error: any) {
    console.error("Analyze error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to analyze user" },
      { status: 500 }
    );
  }
}
