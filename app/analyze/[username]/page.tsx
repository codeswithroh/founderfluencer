"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";

const Tilt = dynamic(() => import("react-parallax-tilt"), { ssr: false });
import { AnalysisResult, DataSource } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import {
  ArrowLeft,
  Share2,
  Download,
  CheckCircle2,
  AlertCircle,
  Users,
  Sparkles,
  Copy,
  Skull,
  Gem,
  Activity,
  TrendingUp,
  Flame,
  Zap,
  Heart,
  Calendar,
  Shield,
  Brain,
  BarChart3,
  Target,
  Clock,
  ArrowUpRight,
  Medal,
  Lightbulb,
  Frown,
  Star,
  MousePointer2,
  Rocket,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Cell,
} from "recharts";

/* ─────────────── Absurd loading messages ─────────────── */
const ABSURD_MESSAGES = [
  "Downloading your entire personality...",
  "Bribing Twitter interns for data...",
  "Reading your tweets at 3am with a Red Bull...",
  "Consulting the VC crystal ball...",
  "Calculating your main character energy...",
  "Judging your bio from 17 different angles...",
  "Running sentiment analysis on your meme game...",
  "Measuring your reply-guy coefficient...",
  "Checking if you tweet more than you ship...",
  "Analyzing your ratio survival rate...",
  "Summoning the ghost of Steve Jobs for advice...",
  "Asking ChatGPT what it really thinks about you...",
  "Cross-referencing your takes with Wikipedia...",
  "Checking how many times you said 'disrupt'...",
  "Running a background check on your takes...",
  "Calculating your ego-to-output ratio...",
  "Scanning for hidden podcast appearances...",
  "Detecting stealth mode startups in your bio...",
  "Counting how many times you called something 'AI'...",
];

/* ─────────────── Utility helpers ─────────────── */
function useComputedInsights(data: AnalysisResult | null) {
  return useMemo(() => {
    if (!data) return null;
    const { profile, tweets, analysis } = data;

    const createdAt = new Date(profile.createdAt);
    const now = new Date();
    const accountAgeDays = Math.max(1, Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)));
    const accountAgeYears = (accountAgeDays / 365).toFixed(1);
    const tweetVelocity = (profile.statusesCount / accountAgeDays).toFixed(1);
    
    let rawEngagement = 0;
    let mostActiveHour: Record<number, number> = {};
    
    if (tweets && tweets.length > 0) {
      rawEngagement = Math.round(tweets.reduce((s, t) => s + (t.likes || 0) + (t.retweets || 0) + (t.replies || 0), 0) / tweets.length);
      mostActiveHour = tweets.reduce((acc, t) => {
        const h = new Date(t.createdAt).getHours();
        acc[h] = (acc[h] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
    }

    const avgEngagement = rawEngagement > 0 ? rawEngagement : Math.max(12, Math.floor(profile.followers * 0.005) + Math.floor(Math.random() * 10));
    
    const followerRatio = profile.following > 0 ? (profile.followers / profile.following).toFixed(1) : "0";
    const topTweet = tweets.length > 0 ? tweets.reduce((m, t) => ((t.likes||0) > (m.likes||0) ? t : m), tweets[0]) : null;
    const top5 = tweets.length > 0 ? [...tweets].sort((a, b) => (b.likes||0) - (a.likes||0)).slice(0, 5).map((t, i) => ({
      name: `T${i + 1}`,
      likes: t.likes || 0,
      retweets: t.retweets || 0,
      replies: t.replies || 0,
    })) : [];

    const hash = profile.userName.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const base = analysis.founder_score;
    const variance = (n: number) => Math.min(10, Math.max(1, base + ((hash + n) % 5) - 2));
    const scoreBreakdown = [
      { subject: "Vision", score: variance(0), fullMark: 10 },
      { subject: "Execution", score: variance(1), fullMark: 10 },
      { subject: "Communication", score: variance(2), fullMark: 10 },
      { subject: "Hustle", score: variance(3), fullMark: 10 },
      { subject: "Resilience", score: variance(4), fullMark: 10 },
    ];

    const peakHourEntry = Object.entries(mostActiveHour).sort((a, b) => b[1] - a[1])[0];
    const peakHour = peakHourEntry ? `${peakHourEntry[0]}:00` : ["09:00", "14:00", "19:00", "22:00"][Math.floor(Math.random() * 4)];

    return {
      accountAgeDays,
      accountAgeYears,
      tweetVelocity,
      avgEngagement,
      followerRatio,
      topTweet,
      top5,
      scoreBreakdown,
      peakHour,
      totalTweetsAnalyzed: tweets?.length || 0,
    };
  }, [data]);
}

/* ─────────────── Animated counter ─────────────── */
function AnimatedCounter({ target, duration = 1500 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const inc = target / (duration / 16);
    const timer = setInterval(() => {
      start += inc;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return <span>{count}</span>;
}

/* ─────────────── Chart tooltip ─────────────── */
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-[#1a1a1a]/90 px-4 py-3 shadow-2xl backdrop-blur-md">
      <p className="mb-1 text-xs font-semibold text-white">{label}</p>
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-xs text-white/60">
          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
          {entry.name}: {entry.value.toLocaleString()}
        </div>
      ))}
    </div>
  );
}

/* ─────────────── Loading screen ─────────────── */
function LoadingScreen({ username }: { username: string }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setIdx((i) => (i + 1) % ABSURD_MESSAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-[#111110] px-6">
      <div className="relative mb-10 flex h-32 w-32 items-center justify-center">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`absolute h-2.5 w-2.5 rounded-full ${i % 2 === 0 ? "bg-[#c3f250]" : "bg-[#c3f250]/40"}`}
            style={{
              animation: `orbit ${2 + i * 0.6}s linear infinite`,
              animationDelay: `${i * 0.3}s`,
            }}
          />
        ))}
        <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#c3f250]/10 border border-[#c3f250]/20">
          <Brain className="h-8 w-8 text-[#c3f250] animate-pulse" strokeWidth={1.5} />
        </div>
      </div>
      <p className="max-w-md text-center text-lg font-medium leading-relaxed text-white/90" style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem" }}>
        {ABSURD_MESSAGES[idx]}
      </p>
      <div className="mt-8 h-[2px] w-48 overflow-hidden rounded-full bg-white/5">
        <div className="h-full w-1/2 rounded-full bg-[#c3f250] animate-loading-bar" />
      </div>
      <p className="mt-6 text-xs tracking-widest text-[#c3f250]/50 uppercase font-semibold">
        Analyzing @{username}
      </p>
    </div>
  );
}

/* ─────────────── Bento card wrapper ─────────────── */
function BentoCard({
  children,
  className = "",
  gradient = false,
}: {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
}) {
  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border border-white/[0.04] bg-[#1a1a18]/60 backdrop-blur-xl ${className}`}
      style={{
        boxShadow: gradient
          ? "0 0 0 1px rgba(195,242,80,0.1), 0 8px 32px rgba(0,0,0,0.2)"
          : "0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.02)",
      }}
    >
      {gradient && (
        <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
          background: "radial-gradient(circle at top right, rgba(195,242,80,0.15) 0%, transparent 60%)"
        }} />
      )}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  );
}

/* ─────────────── Main page ─────────────── */
export default function AnalyzePage() {
  const params = useParams();
  const username = params.username as string;
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const insights = useComputedInsights(data);

  useEffect(() => {
    if (!username) return;
    fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    })
      .then(async (res) => {
        if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Failed"); }
        return res.json();
      })
      .then((result) => { setData(result); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [username]);

  const cardUrl = data
    ? `/api/card?name=${encodeURIComponent(data.profile.name)}&username=${encodeURIComponent(
        data.profile.userName
      )}&score=${data.analysis.founder_score}&archetype=${encodeURIComponent(
        data.analysis.founder_archetype
      )}&tagline=${encodeURIComponent(data.analysis.tagline)}&cofounder=${encodeURIComponent(
        data.analysis.ideal_cofounder_type
      )}&avatar=${encodeURIComponent(
        (data.profile.profilePicture || "").replace('_normal', '_400x400')
      )}&rarity=${encodeURIComponent(
        data.analysis.rarity
      )}&vibe=${encodeURIComponent(data.analysis.vibe_check)}&roast=${encodeURIComponent(
        data.analysis.roast
      )}`
    : "";

  const fullCardUrl = typeof window !== "undefined" && cardUrl ? `${window.location.origin}${cardUrl}` : "";

  const shareText = data
    ? `FoundrProof analyzed @${data.profile.userName}\n\nScore: ${data.analysis.founder_score}/10 | ${data.analysis.rarity}\nArchetype: ${data.analysis.founder_archetype}\nVibe: ${data.analysis.vibe_check}\n\n"${data.analysis.roast}"\n\nAnalyze yours:`
    : "";

  const handleShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText + " " + (typeof window !== "undefined" ? window.location.href : ""))}`;
    window.open(url, "_blank", "width=600,height=400");
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) return <LoadingScreen username={username} />;

  if (error) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-5 bg-[#111110] px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-serif text-white" style={{ fontFamily: "var(--font-serif)" }}>Something went wrong</h2>
        <p className="text-white/50 font-sans">{error}</p>
        <Link href="/">
          <Button variant="outline" className="gap-2 rounded-xl border-white/10 text-white hover:bg-white/5 mt-4">
            <ArrowLeft className="h-4 w-4" /> Start Over
          </Button>
        </Link>
      </div>
    );
  }

  if (!data || !insights) return null;

  const { profile, analysis } = data;

  return (
    <div className="relative min-h-svh overflow-hidden bg-[#111110]">
      {/* Premium Ambient Background */}
      <div className="pointer-events-none absolute -top-[20%] left-1/2 h-[800px] w-[800px] -translate-x-1/2 rounded-full bg-[#c3f250]/[0.03] blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[600px] w-[600px] rounded-full bg-[#c3f250]/[0.02] blur-[100px]" />

      {/* Noise texture overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {/* Minimal Header */}
        <header className="sticky top-0 z-50 border-b border-white/[0.04] bg-[#111110]/60 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="h-6 w-6 rounded bg-[#c3f250] flex items-center justify-center group-hover:scale-105 transition-transform">
                <svg className="h-4 w-4 text-[#111]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                </svg>
              </div>
              <span className="text-[17px] font-semibold tracking-tight text-white/90">
                FoundrProof
              </span>
            </Link>
            <div className="flex gap-3">
              <Button variant="ghost" size="sm" className="gap-2 rounded-full text-sm text-white/60 hover:bg-white/10 hover:text-white" onClick={handleCopyLink}>
                {copied ? <CheckCircle2 className="h-4 w-4 text-[#c3f250]" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied" : "Copy Link"}
              </Button>
            </div>
          </div>
        </header>

        {/* Limited Analysis Banners */}
        {data.dataSource === "syndication" && (
          <div className="border-b border-yellow-500/20 bg-yellow-500/[0.07]">
            <div className="mx-auto max-w-6xl px-6 py-2 flex items-center gap-2 text-yellow-400/80 text-sm">
              <Zap className="h-3.5 w-3.5 shrink-0" />
              <span>Powered by public tweet data — some stats may be approximate.</span>
            </div>
          </div>
        )}
        {data.dataSource === "ai_only" && (
          <div className="border-b border-orange-500/20 bg-orange-500/[0.07]">
            <div className="mx-auto max-w-6xl px-6 py-2 flex items-center gap-2 text-orange-400/80 text-sm">
              <Brain className="h-3.5 w-3.5 shrink-0" />
              <span>
                <strong className="text-orange-300/90">Limited Analysis</strong> — live Twitter data was unavailable.
                This is an AI cold read based on your handle. Add a{" "}
                <code className="text-orange-300/70 text-xs bg-orange-500/10 px-1 rounded">TWITTERAPI_IO_KEY</code>{" "}
                for the full picture.
              </span>
            </div>
          </div>
        )}

        <main className="mx-auto max-w-6xl px-6 pt-16 pb-24">
          
          {/* Majestic Centered Profile Header */}
          <div className="flex flex-col items-center text-center mb-20 animate-in slide-in-from-bottom-8 duration-1000">
             {profile.profilePicture ? (
               <div className="relative mb-8">
                 <img src={profile.profilePicture.replace('_normal', '_400x400')} alt={profile.name} className="h-40 w-40 rounded-full object-cover ring-4 ring-[#111110] relative z-10" />
                 <div className="absolute inset-0 rounded-full bg-[#c3f250]/20 blur-2xl z-0" />
               </div>
             ) : (
               <div className="h-40 w-40 rounded-full bg-[#c3f250]/10 border border-[#c3f250]/30 flex items-center justify-center text-5xl font-bold text-[#c3f250] mb-8 ring-4 ring-[#111110]">
                 {profile.name[0]}
               </div>
             )}
             
             <h1 className="text-[56px] sm:text-[80px] text-[#f5f5f5] leading-none mb-3 tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>
               {profile.name}
             </h1>
             <p className="text-2xl text-[#c3f250] mb-6" style={{ fontFamily: "var(--font-cursive)" }}>@{profile.userName}</p>
             
             {profile.description && (
               <p className="max-w-2xl text-[19px] text-white/60 leading-relaxed font-sans">{profile.description}</p>
             )}
             
             <div className="mt-8 flex flex-wrap justify-center gap-4 text-[15px] font-medium text-white/50">
               {data.dataSource !== "ai_only" && (
                 <>
                   <span className="flex items-center gap-2 bg-white/5 rounded-full px-5 py-2 border border-white/10"><Users className="h-4 w-4 text-[#c3f250]" /> {profile.followers.toLocaleString()} followers</span>
                   <span className="flex items-center gap-2 bg-white/5 rounded-full px-5 py-2 border border-white/10"><ArrowUpRight className="h-4 w-4 text-[#c3f250]" /> {profile.following.toLocaleString()} following</span>
                 </>
               )}
               {profile.location && <span className="flex items-center gap-2 bg-white/5 rounded-full px-5 py-2 border border-white/10"><Target className="h-4 w-4 text-[#c3f250]" /> {profile.location}</span>}
               {data.dataSource === "ai_only" && (
                 <span className="flex items-center gap-2 bg-orange-500/10 rounded-full px-5 py-2 border border-orange-500/20 text-orange-400/70 text-sm">
                   <Brain className="h-4 w-4" /> AI Cold Read
                 </span>
               )}
             </div>
          </div>

          {/* Grid Layout */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            
            {/* The Big Score (5 cols) */}
            <BentoCard gradient className="md:col-span-5 p-12 flex flex-col items-center text-center min-h-[460px]">
               <div className="flex flex-col items-center justify-center flex-1 w-full">
                 <span className="inline-block px-5 py-2 rounded-full border border-[#c3f250]/20 bg-[#c3f250]/10 text-[#c3f250] font-bold text-[13px] mb-8 uppercase tracking-[0.2em]">
                   {analysis.founder_archetype}
                 </span>
                 <div className="flex items-baseline gap-2 mb-2">
                   <span className="text-[140px] font-bold text-[#c3f250] leading-none tracking-tighter" style={{ textShadow: "0 0 80px rgba(195,242,80,0.3)" }}>
                     <AnimatedCounter target={analysis.founder_score} />
                   </span>
                   <span className="text-4xl font-bold text-white/20">/10</span>
                 </div>
                 <p className="text-sm uppercase tracking-[0.3em] font-bold text-white/40 mb-8">Founder Score</p>
                 <p className="text-xl text-white/80 italic leading-relaxed px-4" style={{ fontFamily: "var(--font-serif)" }}>"{analysis.tagline}"</p>
               </div>
               
               <div className="w-full mt-10 pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                  <div className="flex flex-col items-center p-4 bg-white/[0.02] rounded-2xl border border-white/5 hover:bg-white/[0.04] transition-colors">
                    <Gem className="h-5 w-5 text-[#c3f250] mb-3 opacity-80" />
                    <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Rarity Rank</span>
                    <span className="text-[15px] text-white/90 font-medium text-center">{analysis.rarity}</span>
                  </div>
                  <div className="flex flex-col items-center p-4 bg-white/[0.02] rounded-2xl border border-white/5 hover:bg-white/[0.04] transition-colors">
                    <Activity className="h-5 w-5 text-[#c3f250] mb-3 opacity-80" />
                    <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1">Vibe Check</span>
                    <span className="text-[15px] text-white/90 font-medium text-center">{analysis.vibe_check}</span>
                  </div>
               </div>
            </BentoCard>

            {/* The Storyteller Narrative (7 cols) */}
            <BentoCard className="md:col-span-7 p-10 flex flex-col justify-center">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#c3f250] mb-6 flex items-center gap-2"><Sparkles className="h-4 w-4" /> The Narrative</h3>
              <p className="text-[24px] leading-[1.6] text-white/70 font-sans font-medium">
                 You've been navigating the timeline for <span className="text-white font-bold">{insights.accountAgeYears} years</span>, 
                 maintaining a solid pace with <span className="text-white font-bold">{insights.tweetVelocity} takes per day</span>. 
                 Your community shows up for you, bringing an average of <span className="text-[#c3f250] font-bold">{insights.avgEngagement}</span> interactions per tweet. 
                 You're most active and dropping your hottest takes around <span className="text-white font-bold">{insights.peakHour}</span>, proving that you know exactly when your audience is listening.
              </p>
              
              {/* Roast Block built into narrative */}
              <div className="mt-10 pt-8 border-t border-white/5">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f87171] mb-4 flex items-center gap-2"><Flame className="h-4 w-4" /> The Brutal Truth</p>
                <p className="text-xl text-white/90 leading-relaxed font-serif italic" style={{ fontFamily: "var(--font-serif)" }}>{analysis.roast}</p>
              </div>
            </BentoCard>

            {/* Cofounder Match (7 cols) */}
            <BentoCard className="md:col-span-7 p-10" gradient>
               <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#c3f250] mb-6 flex items-center gap-2"><Users className="h-4 w-4" /> Cofounder Match</h3>
               <p className="text-[40px] text-white mb-4 leading-tight" style={{ fontFamily: "var(--font-serif)" }}>
                 You desperately need a <br/><span className="text-[#c3f250]">{analysis.ideal_cofounder_type}</span>
               </p>
               <p className="text-lg text-white/60 mb-8 max-w-lg">{analysis.cofounder_why}</p>
               
               <div className="flex flex-wrap gap-2 mb-10">
                 {analysis.cofounder_skills?.map((skill) => (
                   <span key={skill} className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-[15px] font-medium text-white/80">{skill}</span>
                 ))}
               </div>
               
               <a href="https://www.cofoundrs.fun" target="_blank" rel="noopener noreferrer" className="inline-flex w-full sm:w-auto">
                  <Button className="h-[52px] w-full px-8 bg-[#c3f250] text-[#111110] hover:bg-[#b2e240] font-bold text-[16px] rounded-xl transition-all shadow-[0_4px_24px_rgba(195,242,80,0.3)] hover:scale-105">
                    Find Your Missing Half
                  </Button>
               </a>
            </BentoCard>
            
            {/* Radar / Skill Tree (5 cols) */}
            <BentoCard className="md:col-span-5 p-10 flex flex-col">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#c3f250] mb-6 flex items-center gap-2"><Target className="h-4 w-4" /> Skill Tree</h3>
              <div className="w-full h-[300px] -ml-4 mt-auto">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={insights.scoreBreakdown} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 13, fill: "rgba(255,255,255,0.5)", fontWeight: 500 }} />
                    <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                    <Radar dataKey="score" stroke="#c3f250" fill="#c3f250" fillOpacity={0.15} strokeWidth={2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </BentoCard>

            {/* Verdict & Strengths (12 cols, split inside) */}
            <BentoCard className="md:col-span-12 p-0 overflow-hidden">
               <div className="grid grid-cols-1 md:grid-cols-2 h-full w-full">
                 <div className="p-10 border-b md:border-b-0 md:border-r border-white/5 bg-white/[0.02] flex flex-col justify-center">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#c3f250] mb-6 flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Investor Verdict</h3>
                    <p className="text-2xl text-white/80 leading-relaxed font-serif italic" style={{ fontFamily: "var(--font-serif)" }}>&ldquo;{analysis.investor_verdict}&rdquo;</p>
                 </div>
                 <div className="p-10 flex flex-col justify-center">
                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-[#c3f250] mb-6 flex items-center gap-2"><Star className="h-4 w-4" /> Core Strengths</h3>
                    <ul className="space-y-4">
                      {analysis.strengths.map((s, i) => (
                        <li key={i} className="flex items-start gap-3 text-[17px] text-white/70">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c3f250] shadow-[0_0_10px_#c3f250]" />
                          {s}
                        </li>
                      ))}
                    </ul>
                 </div>
               </div>
            </BentoCard>

            {/* Custom Startup Ideas (12 cols) */}
            <BentoCard className="md:col-span-12 p-10" gradient>
              <div className="flex items-center gap-4 mb-8">
                <div className="h-12 w-12 rounded-xl bg-[#c3f250]/10 border border-[#c3f250]/20 flex items-center justify-center">
                  <Lightbulb className="h-6 w-6 text-[#c3f250]" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white leading-tight font-serif tracking-tight" style={{ fontFamily: "var(--font-serif)" }}>Your Custom Playbook</h3>
                  <p className="text-sm text-white/50 mt-1">3 AI-curated startup ideas based strictly on your audience and expertise</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {analysis.startup_ideas?.map((idea, i) => (
                  <div key={i} className="flex flex-col p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all hover:-translate-y-1 hover:border-white/10 group shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#c3f250]">Idea 0{i + 1}</span>
                      <span className="h-6 w-6 rounded-full bg-white/5 flex items-center justify-center text-[10px] text-white/40 group-hover:bg-[#c3f250]/10 group-hover:text-[#c3f250] transition-colors"><Rocket className="h-3 w-3" /></span>
                    </div>
                    <h4 className="text-[22px] font-bold text-white mb-3 leading-tight" style={{ fontFamily: "var(--font-serif)" }}>{idea.name}</h4>
                    <p className="text-[15px] text-white/70 leading-relaxed mb-6 flex-1">{idea.description}</p>
                    <div className="pt-4 border-t border-white/5">
                      <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2"><Target className="h-3 w-3" /> Why It Fits You</span>
                      <p className="text-[13px] text-[#c3f250]/80 leading-relaxed font-medium">{idea.why_it_fits}</p>
                    </div>
                  </div>
                ))}
              </div>
            </BentoCard>

            {/* Shareable Card Header (12 cols) */}
            <div className="md:col-span-12 mt-12 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-2">
              <div>
                 <h2 className="text-[40px] text-[#f5f5f5] leading-none tracking-tight mb-2" style={{ fontFamily: "var(--font-serif)" }}>Your Founder Card</h2>
                 <p className="text-white/50 text-[17px]">Download or share your brutally honest founder profile.</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="h-[52px] px-6 rounded-xl border-white/10 text-white hover:bg-white/10 font-semibold" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" /> Share on X
                </Button>
                <a href={fullCardUrl} download={`foundrproof-card-${username}.png`}>
                  <Button className="h-[52px] px-6 bg-[#c3f250] text-[#111110] hover:bg-[#b2e240] rounded-xl font-bold">
                    <Download className="h-4 w-4 mr-2" /> Download
                  </Button>
                </a>
              </div>
            </div>

            {/* Shareable Card Image (12 cols) */}
            <div className="md:col-span-12">
              {fullCardUrl && (
                <Tilt tiltMaxAngleX={4} tiltMaxAngleY={4} perspective={1000} scale={1.01} transitionSpeed={2000} className="w-full">
                  <div className="overflow-hidden rounded-3xl border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.5)] w-full">
                    <img src={fullCardUrl} alt="Founder Card" className="w-full h-auto object-cover" />
                  </div>
                </Tilt>
              )}
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
