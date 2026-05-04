import { NextRequest, NextResponse } from "next/server";

const TWITTERAPI_BASE = "https://api.twitterapi.io";
const SCRAPINGDOG_BASE = "https://api.scrapingdog.com/twitter/";
const SYNDI_BASE = "https://cdn.syndication.twimg.com";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get("username") || "codeswithroh";

  const results: Record<string, any> = {};

  // Layer 1: twitterapi.io
  try {
    const key = process.env.TWITTERAPI_IO_KEY;
    results.twitterapiio = { key_set: !!key, key_prefix: key?.slice(0, 6) };
    const res = await fetch(
      `${TWITTERAPI_BASE}/twitter/user/info?userName=${username}`,
      { headers: { "x-api-key": key || "" } }
    );
    const body = await res.json();
    results.twitterapiio.status = res.status;
    results.twitterapiio.ok = res.ok;
    results.twitterapiio.body = body;
  } catch (e: any) {
    results.twitterapiio = { error: e.message };
  }

  // Layer 2: Scrapingdog
  try {
    const key = process.env.SCRAPINGDOG_API_KEY;
    results.scrapingdog = { key_set: !!key, key_prefix: key?.slice(0, 6) };
    const profileUrl = `https://x.com/${username}`;
    const url = `${SCRAPINGDOG_BASE}?api_key=${key}&parsed=true&url=${encodeURIComponent(profileUrl)}`;
    const res = await fetch(url);
    const body = await res.json();
    results.scrapingdog.status = res.status;
    results.scrapingdog.ok = res.ok;
    results.scrapingdog.body_preview = Array.isArray(body)
      ? `array[${body.length}] first: ${JSON.stringify(body[0]).slice(0, 200)}`
      : JSON.stringify(body).slice(0, 300);
  } catch (e: any) {
    results.scrapingdog.error = e.message;
  }

  // Layer 3: Syndication
  try {
    const url = `${SYNDI_BASE}/timeline/profile?screen_name=${username}&count=5&suppress_response_codes=true&rnd=${Math.random()}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
    });
    const text = await res.text();
    results.syndication = {
      status: res.status,
      ok: res.ok,
      body_preview: text.slice(0, 300),
    };
  } catch (e: any) {
    results.syndication = { error: e.message };
  }

  return NextResponse.json(results, { status: 200 });
}
