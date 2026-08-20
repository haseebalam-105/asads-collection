import { NextResponse } from "next/server";
import { dbGetSettings } from "@/lib/db/settings";

export async function GET() {
  try {
    const settings = await dbGetSettings();
    return NextResponse.json({ metaPixelId: settings.metaPixelId || "" });
  } catch {
    return NextResponse.json({ metaPixelId: "" });
  }
}