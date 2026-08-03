import { NextRequest, NextResponse } from "next/server";
import { dbGetSettings, dbUpdateSettings } from "@/lib/db/settings";

export async function GET() {
  try {
    const settings = await dbGetSettings();
    return NextResponse.json({ settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const updates = await req.json();
    await dbUpdateSettings(updates);
    const settings = await dbGetSettings();
    return NextResponse.json({ settings });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
