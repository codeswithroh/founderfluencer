import { FounderAnalysis } from "@/types";

const API_KEY = process.env.OPENROUTER_API_KEY || "";
const BASE_URL = "https://openrouter.ai/api/v1";

const SYSTEM_PROMPT = `You are FounderFluencer, an experienced, sharp, and slightly cynical Silicon Valley VC partner who analyzes people's founder potential based on their Twitter/X presence.

Analyze the provided profile data and return ONLY a JSON object with these exact keys:
{
  "founder_score": number (1-10, be honest but encouraging),
  "founder_archetype": string (one of: "Visionary Dreamer", "Relentless Hustler", "Technical Builder", "Community Wizard", "Content Machine", "Product Obsessive", "Sales Shark", "Culture Architect"),
  "tagline": string (sharp, max 80 chars, describe their founder vibe),
  "strengths": [string, string, string] (specific, evidence-based from their tweets/bio),
  "weaknesses": [string, string] (constructive, framed as growth areas),
  "ideal_cofounder_type": string (one of: "Technical CTO", "Design-Focused CPO", "Revenue-Obsessed COO", "Growth Hacker CMO", "Operations Wizard", "Domain Expert Partner"),
  "cofounder_why": string (1-2 sentences explaining the pairing logic),
  "cofounder_skills": [string, string, string] (3 specific skills),
  "roast": string (one brutal but constructive roast line about their profile/tweets, max 100 chars),
  "rarity": string (one of: "Mythic", "Legendary", "Epic", "Rare", "Uncommon", "Common" based on founder_score and engagement),
  "vibe_check": string (a concise 2-3 word description of their energy, e.g. "High Agency", "Product Led", "Echo Chamber"),
  "investor_verdict": string (a realistic, sharp one-liner an actual VC partner would say after reviewing their profile in a deal-flow meeting, max 100 chars),
  "startup_ideas": [
    {
      "name": string (catchy startup name),
      "description": string (1-2 sentences describing the hyper-personalized idea),
      "why_it_fits": string (1 sentence explaining why this specific founder has the right audience/skills for this)
    },
    ... (exactly 3 ideas)
  ]
}

Rules:
- Base analysis on: bio clarity, tweet quality/consistency, engagement, follower trajectory, thought leadership signals
- The startup ideas MUST be hyper-personalized based on their explicit interests, complaints, and domain expertise shown in their tweets. Do NOT give generic ideas (e.g., no "AI to-do list").
- The investor_verdict should sound like a real quote from a YC partner or tier-1 VC.
- Return ONLY valid JSON, no markdown, no explanations.`;

function getRarity(score: number): string {
  if (score >= 10) return "Mythic";
  if (score >= 9) return "Legendary";
  if (score >= 7) return "Epic";
  if (score >= 5) return "Rare";
  if (score >= 3) return "Uncommon";
  return "Common";
}

function getRarityEmoji(rarity: string): string {
  const map: Record<string, string> = {
    Mythic: "👑",
    Legendary: "🔥",
    Epic: "⚡",
    Rare: "💎",
    Uncommon: "🌱",
    Common: "🥔",
  };
  return map[rarity] || "🌱";
}

export async function analyzeFounderWithIdeas(
  profile: any,
  tweets: any[],
  seed?: string
): Promise<FounderAnalysis> {
  const userPrompt = `Analyze this Twitter user as a potential founder:

Profile:
${JSON.stringify(profile, null, 2)}

Recent Tweets (${tweets.length}):
${tweets.map((t, i) => `${i + 1}. [${t.likes} likes, ${t.retweets} RTs] ${t.text}`).join("\n")}

Return ONLY JSON.`;

  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${API_KEY}`,
        "HTTP-Referer": "https://founderfluencer.vercel.app", // OpenRouter required headers
        "X-Title": "FounderFluencer"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        seed: seed ? seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0) : undefined,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("OpenRouter API failed:", res.status, errorText);
      throw new Error("Failed to generate highly curated analysis via AI.");
    }

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    
    if (!content) {
      throw new Error("Empty AI response received.");
    }

    // Try to parse the JSON output
    try {
      // Claude might wrap JSON in markdown blocks despite instructions
      const cleanContent = content.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      const parsed = JSON.parse(cleanContent);
      
      const score = Math.max(1, Math.min(10, Math.round(parsed.founder_score || 5)));
      const rarity = parsed.rarity || getRarity(score);
      const rarityEmoji = getRarityEmoji(rarity.split(" ").pop() || rarity);
      
      if (!parsed.startup_ideas || !Array.isArray(parsed.startup_ideas) || parsed.startup_ideas.length === 0) {
        throw new Error("AI failed to generate startup ideas.");
      }

      return {
        founder_score: score,
        founder_archetype: parsed.founder_archetype || "Mystery Founder",
        tagline: parsed.tagline || "Founder in the making",
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 3) : ["Ambitious", "Active on X", "Has a vision"],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.slice(0, 2) : ["Needs more consistency"],
        ideal_cofounder_type: parsed.ideal_cofounder_type || "Technical CTO",
        cofounder_why: parsed.cofounder_why || "Every great founder needs a complementary partner.",
        cofounder_skills: Array.isArray(parsed.cofounder_skills) ? parsed.cofounder_skills.slice(0, 3) : ["Engineering", "Product", "Leadership"],
        roast: parsed.roast || "Still figuring out the bio, but the energy is there.",
        rarity: rarity.includes(" ") ? rarity : `${rarityEmoji} ${rarity}`,
        vibe_check: parsed.vibe_check || "Chaotic Good",
        investor_verdict: parsed.investor_verdict || "Would schedule a call just to see what happens.",
        startup_ideas: parsed.startup_ideas.slice(0, 3),
      };
    } catch (parseError) {
      console.error("Failed to parse OpenRouter JSON output:", content);
      throw new Error("Failed to parse the highly curated ideas from the AI.");
    }
  } catch (error: any) {
    console.error("Analysis Error:", error);
    // Explicitly re-throw to trigger the frontend error boundary (no fallback)
    throw new Error(error.message || "Something went wrong generating your custom analysis.");
  }
}

// ─── Blind Mode: AI cold-read with no Twitter data ──────────────────────────

const BLIND_SYSTEM = `You are FounderFluencer, a sharp Silicon Valley VC who sizes up founders.

IMPORTANT: You have ZERO live Twitter data for this user. You are doing a cold read.
- If you recognise this username from your training data (e.g. they're a public figure, known builder, creator), use what you know.
- If you do NOT recognise them, infer from the username itself: naming patterns, tech keywords, creative handles, etc.
- Do NOT fabricate specific tweets, follower counts, or engagement numbers.
- Keep scores honest: unknown users default to 4-6 range unless the username itself signals strong domain expertise.

Return ONLY a JSON object with these exact keys:
{
  "founder_score": number (1-10),
  "founder_archetype": string (one of: "Visionary Dreamer", "Relentless Hustler", "Technical Builder", "Community Wizard", "Content Machine", "Product Obsessive", "Sales Shark", "Culture Architect"),
  "tagline": string (max 80 chars),
  "strengths": [string, string, string],
  "weaknesses": [string, string],
  "ideal_cofounder_type": string (one of: "Technical CTO", "Design-Focused CPO", "Revenue-Obsessed COO", "Growth Hacker CMO", "Operations Wizard", "Domain Expert Partner"),
  "cofounder_why": string,
  "cofounder_skills": [string, string, string],
  "roast": string (max 100 chars, roast their handle if nothing else),
  "rarity": string (one of: "Mythic", "Legendary", "Epic", "Rare", "Uncommon", "Common"),
  "vibe_check": string (2-3 words),
  "investor_verdict": string (max 100 chars),
  "startup_ideas": [
    { "name": string, "description": string, "why_it_fits": string },
    { "name": string, "description": string, "why_it_fits": string },
    { "name": string, "description": string, "why_it_fits": string }
  ]
}
Return ONLY valid JSON.`;

export async function analyzeFounderBlindMode(username: string): Promise<FounderAnalysis> {
  const userPrompt = `X/Twitter username: @${username}

No live data available. Do a cold read based on the username and any public knowledge you have about this person.
Return ONLY JSON.`;

  try {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
        "HTTP-Referer": "https://foundrproof.vercel.app",
        "X-Title": "FoundrProof",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        messages: [
          { role: "system", content: BLIND_SYSTEM },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) throw new Error("AI blind-mode analysis failed.");

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) throw new Error("Empty AI response.");

    const clean = content.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsed = JSON.parse(clean);

    const score = Math.max(1, Math.min(10, Math.round(parsed.founder_score || 5)));
    const rarity = parsed.rarity || getRarity(score);
    const rarityEmoji = getRarityEmoji(rarity.split(" ").pop() || rarity);

    return {
      founder_score: score,
      founder_archetype: parsed.founder_archetype || "Mystery Founder",
      tagline: parsed.tagline || "Signal unclear — but the handle's interesting.",
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths.slice(0, 3) : ["Unknown potential", "Untested resilience", "Possibly contrarian"],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses.slice(0, 2) : ["Needs more signal", "Hard to read"],
      ideal_cofounder_type: parsed.ideal_cofounder_type || "Technical CTO",
      cofounder_why: parsed.cofounder_why || "Complementary skills always help.",
      cofounder_skills: Array.isArray(parsed.cofounder_skills) ? parsed.cofounder_skills.slice(0, 3) : ["Execution", "Distribution", "Domain expertise"],
      roast: parsed.roast || "Even your handle is ambiguous. Bold strategy.",
      rarity: rarity.includes(" ") ? rarity : `${rarityEmoji} ${rarity}`,
      vibe_check: parsed.vibe_check || "Stealth Mode",
      investor_verdict: parsed.investor_verdict || "Needs more data — but that's kind of their whole brand.",
      startup_ideas: Array.isArray(parsed.startup_ideas) ? parsed.startup_ideas.slice(0, 3) : [],
    };
  } catch (error: any) {
    throw new Error(error.message || "AI cold read failed.");
  }
}
