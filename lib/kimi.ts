import { FounderAnalysis } from "@/types";

const API_KEY = process.env.KIMI_API_KEY || "";
const BASE_URL = process.env.KIMI_BASE_URL || "https://api.moonshot.cn/v1";

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
  "investor_verdict": string (a realistic, sharp one-liner an actual VC partner would say after reviewing their profile in a deal-flow meeting, max 100 chars)
}

Rules:
- Base analysis on: bio clarity, tweet quality/consistency, engagement, follower trajectory, thought leadership signals
- A high follower count alone doesn't mean high founder score
- Look for: problem-solving tweets, building-in-public, strong opinions, consistency, community engagement
- Be analytical — scores below 5 should have actionable feedback
- The investor_verdict should sound like a real quote from a YC partner or tier-1 VC (e.g. evaluating TAM, moats, technical depth, or GTM advantages)
- Rarity: 9-10 = Mythic/Legendary, 7-8 = Epic, 5-6 = Rare, 3-4 = Uncommon, 1-2 = Common
- Return ONLY valid JSON, no markdown, no explanations`;

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

function generateFallbackAnalysis(profile: any, tweets: any[]): FounderAnalysis {
  const followers = profile.followers || 0;
  const statusesCount = profile.statusesCount || 0;
  const isVerified = profile.isBlueVerified;
  const bio = (profile.description || "").toLowerCase();
  const name = profile.name || "Founder";

  // Heuristic scoring
  let score = 5;
  if (followers > 100000) score += 1;
  if (followers > 1000000) score += 1;
  if (statusesCount > 1000) score += 1;
  if (isVerified) score += 1;
  if (bio.includes("founder") || bio.includes("ceo")) score += 1;
  if (bio.includes("building") || bio.includes("shipping")) score += 1;
  if (tweets.some((t) => t.text.toLowerCase().includes("building") || t.text.toLowerCase().includes("launch")))
    score += 1;
  score = Math.min(10, Math.max(3, score));

  const rarity = getRarity(score);
  const rarityEmoji = getRarityEmoji(rarity);

  // Determine archetype from bio + tweets
  let archetype = "Mystery Founder";
  if (bio.includes("engineer") || bio.includes("code") || bio.includes("dev"))
    archetype = "Technical Builder";
  else if (bio.includes("sales") || bio.includes("growth") || bio.includes("marketing"))
    archetype = "Sales Shark";
  else if (bio.includes("design") || bio.includes("product"))
    archetype = "Product Obsessive";
  else if (followers > 50000)
    archetype = "Community Wizard";
  else if (statusesCount > 5000)
    archetype = "Content Machine";
  else if (bio.includes("vision") || bio.includes("future"))
    archetype = "Visionary Dreamer";
  else
    archetype = "Relentless Hustler";

  // Cofounder matching
  let cofounder = "Technical CTO";
  if (archetype === "Technical Builder") cofounder = "Revenue-Obsessed COO";
  else if (archetype === "Sales Shark") cofounder = "Technical CTO";
  else if (archetype === "Product Obsessive") cofounder = "Growth Hacker CMO";
  else if (archetype === "Community Wizard") cofounder = "Operations Wizard";

  const taglines = [
    "Building in public, breaking things silently",
    "Tweet first, build later",
    "The main character of their own startup movie",
    "Has opinions. Will ship.",
    "One viral tweet away from product-market fit",
    "Dreaming big, posting bigger",
    "A hustle wrapped in a hoodie",
    "Here to build, not to browse",
    "Probably debugging at 3am",
    "Would pivot for clout",
  ];
  const tagline = taglines[Math.floor(Math.random() * taglines.length)];

  const roasts = [
    "Bio says 'founder' but tweets say 'professional tweeter'",
    "Your tweet-to-ship ratio is concerning",
    "Building in public? More like tweeting in public",
    "You've tweeted more than most people breathe",
    "Your followers are waiting for the product, not the thread",
    "Has strong opinions. Has stronger WiFi.",
    "Would definitely pitch VCs with a Notion link",
    "Your DMs are 90% 'let's grab coffee'",
  ];
  const roast = roasts[Math.floor(Math.random() * roasts.length)];

  const vibes = [
    "Chaotic Good",
    "Main Character Energy",
    "Quiet Grinder",
    "Hustle Harder",
    "Vibe Coder",
    "Tweet CEO",
    "Meme Lord",
    "Sleep Deprived",
    "Optimistic Nihilist",
    "Echo Chamber Escapee",
  ];
  const vibe = vibes[Math.floor(Math.random() * vibes.length)];

  const investorVerdicts = [
    "High agency founder, but struggling to see the technical moat.",
    "TAM seems small, but their distribution advantage is undeniable.",
    "Classic case of a solution looking for a problem. Too early for us.",
    "Strong signal-to-noise ratio in their thinking. Let's track their next 6 months.",
    "Good market, but go-to-market seems entirely dependent on organic virality.",
    "Shows extreme hustle, but unclear if they can attract top-tier engineering talent.",
    "Would take a first meeting just based on their thought leadership in the space."
  ];
  const investorVerdict = investorVerdicts[Math.floor(Math.random() * investorVerdicts.length)];

  const strengthsPool = [
    "Strong personal brand and audience",
    "Consistent content creator",
    "Clear vision in bio and tweets",
    "High engagement with community",
    "Building-in-public mentality",
    "Not afraid to share strong opinions",
    "Active networker on X",
    "Shows persistence and consistency",
  ];
  const shuffled = [...strengthsPool].sort(() => Math.random() - 0.5);

  const weaknessesPool = [
    "Could show more technical depth",
    "Tweets are more inspiration than execution",
    "Needs clearer product focus",
    "Could engage more with replies",
    "Bio could be more specific about what they're building",
  ];
  const wshuffled = [...weaknessesPool].sort(() => Math.random() - 0.5);

  const skillsMap: Record<string, string[]> = {
    "Technical CTO": ["System Architecture", "Full-Stack Development", "Technical Hiring"],
    "Design-Focused CPO": ["UX/UI Design", "User Research", "Product Strategy"],
    "Revenue-Obsessed COO": ["Sales Execution", "Operations", "Fundraising"],
    "Growth Hacker CMO": ["Performance Marketing", "Viral Loops", "Analytics"],
    "Operations Wizard": ["Process Optimization", "Team Building", "Financial Planning"],
    "Domain Expert Partner": ["Industry Knowledge", "Network", "Go-to-Market"],
  };

  return {
    founder_score: score,
    founder_archetype: archetype,
    tagline,
    strengths: shuffled.slice(0, 3),
    weaknesses: wshuffled.slice(0, 2),
    ideal_cofounder_type: cofounder,
    cofounder_why: `As a ${archetype}, they bring unique strengths but need a ${cofounder} to balance their skill set and scale the business effectively.`,
    cofounder_skills: skillsMap[cofounder] || ["Leadership", "Strategy", "Execution"],
    roast,
    rarity: `${rarityEmoji} ${rarity}`,
    vibe_check: vibe,
    investor_verdict: investorVerdict,
    startup_ideas: [
      { name: "AI-powered personal brand coach", description: "Helps founders optimize their online presence", why_it_fits: "Matches their communication strengths" },
      { name: "Micro-SaaS for Twitter analytics", description: "Deep analytics for X power users", why_it_fits: "They already live on the platform" },
    ],
  };
}

export async function analyzeFounder(
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
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: "kimi-latest",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      console.warn("kimi API failed, using fallback analysis:", res.status);
      return generateFallbackAnalysis(profile, tweets);
    }

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content;
    if (!content) {
      console.warn("Empty kimi response, using fallback");
      return generateFallbackAnalysis(profile, tweets);
    }

    try {
      const parsed = JSON.parse(content);
      const score = Math.max(1, Math.min(10, Math.round(parsed.founder_score || 5)));
      const rarity = parsed.rarity || getRarity(score);
      const rarityEmoji = getRarityEmoji(rarity.split(" ").pop() || rarity);
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
        startup_ideas: Array.isArray(parsed.startup_ideas) ? parsed.startup_ideas.slice(0, 3) : [
          { name: "AI-powered personal brand coach", description: "Helps founders optimize their online presence", why_it_fits: "Matches their communication strengths" },
        ],
      };
    } catch (e) {
      console.warn("Failed to parse kimi response, using fallback", e);
      return generateFallbackAnalysis(profile, tweets);
    }
  } catch (error) {
    console.warn("kimi API error, using fallback:", error);
    return generateFallbackAnalysis(profile, tweets);
  }
}
