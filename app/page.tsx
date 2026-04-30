"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AtSign } from "lucide-react";

export default function HomePage() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAnalyze = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = username.replace(/^@/, "").replace(/https?:\/\/(www\.)?(twitter|x)\.com\//, "").split('?')[0].trim();
    if (!clean) return;
    setLoading(true);
    router.push(`/analyze/${clean}`);
  };

  return (
    <div className="relative min-h-screen bg-[#f5f5f5] overflow-hidden selection:bg-[#c3f250]/50">
      {/* Background video — looping, muted, autoplay */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
        src="/hero.mp4"
      />



      {/* Content */}
      <div className="relative z-10 flex min-h-screen flex-col font-sans">
        {/* Floating Nav Pill */}
        <header className="flex items-center justify-center pt-8 px-6 sm:px-10">
          <div className="flex items-center justify-between gap-8 bg-black/10 backdrop-blur-xl border border-white/20 rounded-[20px] px-8 py-3 shadow-[0_8px_32px_rgba(0,0,0,0.05)] w-full max-w-4xl">
            <div className="flex items-center gap-2.5">
              <div className="h-6 w-6 rounded bg-[#c3f250] flex items-center justify-center">
                <svg className="h-4 w-4 text-stone-800" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                </svg>
              </div>
              <span className="text-[17px] font-semibold tracking-tight text-stone-800">
                FoundrProof
              </span>
            </div>
            {/* Rage-bait words */}
            <div className="hidden sm:flex items-center gap-8 text-[15px] font-medium text-stone-700">
              <span>Grindset</span>
              <span>Echo Chamber</span>
              <span>Burnout</span>
            </div>
          </div>
        </header>

        {/* Hero */}
        <main className="flex flex-1 flex-col items-center justify-center px-6 pb-32">
          <div className="flex w-full max-w-[800px] flex-col items-center gap-6 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000">
            
            {/* Headline matching the reference image's serif typography */}
            <h1 className="text-[64px] leading-[1.05] tracking-tight text-[#2d2d2a] sm:text-[96px]" style={{ fontFamily: "var(--font-serif)" }}>
              Are you really
              <br />
              a <span className="text-[#a4d441] inline-block -rotate-2 mr-1 sm:mr-2" style={{ fontFamily: "var(--font-cursive)", fontSize: "1.2em", WebkitTextStroke: "1px #2d2d2a" }}>founder</span>?
            </h1>

            {/* Subtext */}
            <p className="mx-auto max-w-[600px] text-[18px] leading-relaxed text-[#4a4a45] font-medium drop-shadow-sm">
              Drop your X (Twitter) handle. Our AI scans your tweets to calculate your Founder Score, brutally roast your takes, and identify the co-founder you desperately need.
            </p>

            <form
              onSubmit={handleAnalyze}
              className="mt-8 flex w-full max-w-[560px] flex-col gap-4 sm:flex-row relative"
            >
              <div className="relative flex-1 group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-6 pointer-events-none text-stone-400 group-focus-within:text-stone-800 transition-colors font-semibold text-[18px] z-10">
                  @
                </div>
                <Input
                  placeholder="elonmusk"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-[60px] pl-[42px] pr-6 text-[18px] font-medium bg-white border-white text-[#2d2d2a] placeholder:text-stone-400
                    rounded-[20px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] transition-all
                    focus-visible:border-stone-300 focus-visible:ring-4 focus-visible:ring-stone-400/20 focus-visible:ring-offset-0"
                  disabled={loading}
                />
              </div>
              <Button
                type="submit"
                disabled={loading || !username.trim()}
                className="h-[60px] px-10 bg-[#c3f250] text-[#2d2d2a] hover:bg-[#b2e240]
                  font-semibold text-[18px] rounded-[20px] transition-all shadow-[0_4px_24px_rgba(195,242,80,0.4)]
                  hover:scale-[1.02] hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(195,242,80,0.6)] shrink-0 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:translate-y-0"
              >
                {loading ? "Scanning..." : "Start Journey"}
              </Button>
            </form>

          </div>
        </main>
      </div>
    </div>
  );
}
