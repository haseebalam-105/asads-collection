import { NextRequest, NextResponse } from "next/server";
import { dbGetSettings } from "@/lib/db/settings";
import { isDbConfigured } from "@/lib/db";
import { sendMetaEvent, MetaCustomData } from "@/lib/meta-capi";

// Prevent Next.js from statically caching this route.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// POST /api/meta-events — receives ViewContent / AddToCart / InitiateCheckout
// (and any other) events from the browser and relays them to Meta's
// Conversions API using the Pixel ID + access token saved in admin settings.
// The access token never reaches the client — only this server route has it.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      eventName,
      eventId,
      eventSourceUrl,
      customData,
      email,
      phone,
      fbp,
      fbc,
    }: {
      eventName?: string;
      eventId?: string;
      eventSourceUrl?: string;
      customData?: MetaCustomData;
      email?: string;
      phone?: string;
      fbp?: string;
      fbc?: string;
    } = body;

    if (!eventName) {
      return NextResponse.json({ error: "eventName is required." }, { status: 400 });
    }

    if (!isDbConfigured()) {
      return NextResponse.json({ skipped: true });
    }

    const settings = await dbGetSettings();
    if (!settings.metaPixelId || !settings.metaAccessToken) {
      // Tracking not configured yet — no-op, not an error.
      return NextResponse.json({ skipped: true });
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    const result = await sendMetaEvent({
      pixelId: settings.metaPixelId,
      accessToken: settings.metaAccessToken,
      testEventCode: settings.metaTestEventCode || undefined,
      eventName,
      eventId,
      eventSourceUrl,
      userData: { email, phone, ip, userAgent, fbp, fbc },
      customData,
    });

    return NextResponse.json({ ok: true, result });
  } catch (err) {
    // Ad-tracking failures should never surface to the customer as an error.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
