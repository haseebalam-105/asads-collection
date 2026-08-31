import { NextRequest, NextResponse } from "next/server";
import { dbGetSettings, dbUpdateSettings } from "@/lib/db/settings";

// Same fix as the public /api/settings route — prevent Next.js from
// statically caching this GET handler at build time.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  "Pragma": "no-cache",
  "Expires": "0",
};

export async function GET() {
  try {
    const settings = await dbGetSettings();
    return NextResponse.json({ settings }, { headers: NO_CACHE_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const updates = await req.json();
    await dbUpdateSettings(updates);
    const settings = await dbGetSettings();
    return NextResponse.json({ settings }, { headers: NO_CACHE_HEADERS });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
