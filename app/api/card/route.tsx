import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const name = searchParams.get("name") || "Unknown";
  const username = searchParams.get("username") || "unknown";
  const score = parseInt(searchParams.get("score") || "5", 10);
  const archetype = searchParams.get("archetype") || "Founder";
  const tagline = searchParams.get("tagline") || "";
  const avatar = searchParams.get("avatar") || "";
  const roast = searchParams.get("roast") || "";

  let avatarSrc = "";
  if (avatar) {
    try {
      const imgRes = await fetch(avatar);
      if (imgRes.ok) {
        const blob = await imgRes.arrayBuffer();
        const contentType = imgRes.headers.get("content-type") || "image/png";
        const base64 = btoa(String.fromCharCode(...new Uint8Array(blob)));
        avatarSrc = `data:${contentType};base64,${base64}`;
      }
    } catch (e) {
      console.warn("Failed to fetch avatar:", e);
    }
  }

  const firstLetter = name && name.length > 0 ? name[0] : "?";
  const displayTagline = tagline || "Founder in the making";

  // Viral aesthetic using #c3f250 lime green for high contrast with chart background
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "row",
          background: "#111110", // Premium dark off-black
          color: "#f5f5f5",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden"
        }}
      >
        {/* Abstract Chart Background */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", opacity: 0.1 }}>
          <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="grad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stop-color="#c3f250" stop-opacity="0" />
                <stop offset="100%" stop-color="#c3f250" stop-opacity="0.8" />
              </linearGradient>
            </defs>
            <path d="M0,630 L0,400 Q150,500 300,300 T600,250 T900,100 T1200,50 L1200,630 Z" fill="url(#grad)" />
            <path d="M0,400 Q150,500 300,300 T600,250 T900,100 T1200,50" fill="none" stroke="#c3f250" stroke-width="4" />
            
            {/* Grid lines */}
            <line x1="0" y1="105" x2="1200" y2="105" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
            <line x1="0" y1="210" x2="1200" y2="210" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
            <line x1="0" y1="315" x2="1200" y2="315" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
            <line x1="0" y1="420" x2="1200" y2="420" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
            <line x1="0" y1="525" x2="1200" y2="525" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
            <line x1="300" y1="0" x2="300" y2="630" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
            <line x1="600" y1="0" x2="600" y2="630" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
            <line x1="900" y1="0" x2="900" y2="630" stroke="rgba(255,255,255,0.1)" stroke-width="1" />
          </svg>
        </div>

        {/* Left Section: Content */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1, padding: "60px", paddingRight: "40px", zIndex: 10 }}>
          
          {/* Header */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
              <div
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  background: "#2d2d2a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "40px",
                  fontWeight: "bold",
                  overflow: "hidden",
                  border: "2px solid rgba(195, 242, 80, 0.4)",
                  boxShadow: "0 0 20px rgba(195,242,80,0.2)"
                }}
              >
                {avatarSrc ? (
                  <img src={avatarSrc} width={100} height={100} style={{ objectFit: "cover" }} />
                ) : (
                  <span>{firstLetter}</span>
                )}
              </div>
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <span style={{ fontSize: "48px", fontWeight: "bold", letterSpacing: "-1px", lineHeight: "1.1" }}>{name}</span>
                <span style={{ fontSize: "24px", color: "#8a8a86", marginTop: "4px" }}>@{username}</span>
              </div>
            </div>
          </div>

          {/* Roast / Tagline */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
             <div style={{ display: "flex", alignSelf: "flex-start", background: "rgba(195, 242, 80, 0.15)", padding: "12px 24px", borderRadius: "100px", border: "1px solid rgba(195, 242, 80, 0.3)", boxShadow: "0 4px 20px rgba(195,242,80,0.1)" }}>
                <span style={{ color: "#c3f250", fontSize: "24px", fontWeight: "bold", letterSpacing: "1px", textTransform: "uppercase" }}>{archetype}</span>
             </div>
             <div style={{ display: "flex" }}>
               <span style={{ fontSize: "32px", color: "#d6d6d4", lineHeight: "1.4", fontStyle: "italic", fontWeight: "500", borderLeft: "4px solid #c3f250", paddingLeft: "20px" }}>"{displayTagline}"</span>
             </div>
             {roast && (
               <div style={{ display: "flex", marginTop: "8px", background: "rgba(255,255,255,0.03)", padding: "20px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(10px)" }}>
                 <span style={{ fontSize: "22px", color: "#a8a8a4", lineHeight: "1.5" }}>{roast}</span>
               </div>
             )}
          </div>
          
        </div>

        {/* Right Section: Giant Score */}
        <div style={{ width: "400px", display: "flex", flexDirection: "column", background: "rgba(22, 22, 20, 0.8)", borderLeft: "1px solid rgba(255,255,255,0.05)", padding: "60px", alignItems: "center", justifyContent: "center", zIndex: 10, backdropFilter: "blur(10px)" }}>
           <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px" }}>
              <span style={{ fontSize: "20px", color: "#8a8a86", textTransform: "uppercase", letterSpacing: "4px", fontWeight: "600" }}>Founder Score</span>
              <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                 <span style={{ fontSize: "160px", fontWeight: "bold", color: "#c3f250", lineHeight: "1", letterSpacing: "-5px", textShadow: "0 0 40px rgba(195,242,80,0.4)" }}>{score}</span>
                 <span style={{ fontSize: "40px", color: "#4a4a45", fontWeight: "bold" }}>/10</span>
              </div>
           </div>
           
           {/* Techy Data Bar */}
           <div style={{ display: "flex", width: "100%", gap: "12px", marginTop: "40px", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "30px", justifyContent: "space-between" }}>
             <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
               <span style={{ fontSize: "14px", color: "#666" }}>STATUS</span>
               <span style={{ fontSize: "18px", color: "#c3f250", fontWeight: "bold" }}>VERIFIED</span>
             </div>
             <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
               <span style={{ fontSize: "14px", color: "#666" }}>RANK</span>
               <span style={{ fontSize: "18px", color: "#fff", fontWeight: "bold" }}>TOP {100 - score * 8}%</span>
             </div>
           </div>

           <div style={{ display: "flex", position: "absolute", bottom: "40px", right: "60px" }}>
             <div style={{ display: "flex", alignItems: "center", gap: "12px", opacity: 0.5 }}>
               <span style={{ fontSize: "24px", fontWeight: "bold", color: "#fff", letterSpacing: "-1px" }}>FoundrProof</span>
             </div>
           </div>
        </div>

      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
