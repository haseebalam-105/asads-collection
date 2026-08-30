import { NextResponse } from "next/server";
import { dbGetSettings } from "@/lib/db/settings";

// Force this route to run fresh on every request. Without this, Next.js's
// App Router treats a GET handler with no dynamic APIs (cookies/headers/
// searchParams) as static and caches its response at build time on Vercel —
// meaning it would keep returning whatever was in the DB when you last
// deployed, ignoring anything saved afterward in /admin/settings.
export const dynamic = "force-dynamic";
export const revalidate = 0;

// Public settings endpoint — used by the storefront (Navbar, Footer, contact
// info, Meta Pixel, etc.) to read the live values saved from /admin/settings.
// Only ever exposes fields that are already shown publicly on the site.
export async function GET() {
  try {
    const settings = await dbGetSettings();
    return NextResponse.json({
      brandName: settings.brandName,
      brandNameUr: settings.brandNameUr,
      logoSrc: settings.logoSrc,
      deliveryFee: settings.deliveryFee,
      freeDeliveryThreshold: settings.freeDeliveryThreshold,
      phone: settings.phone,
      whatsapp: settings.whatsapp,
      email: settings.email,
      facebook: settings.facebook,
      city: settings.city,
      metaPixelId: settings.metaPixelId || "",
    });
  } catch {
    // DB unreachable — fall back to null so the client keeps using its
    // built-in defaults instead of breaking the page.
    return NextResponse.json({ error: "unavailable" }, { status: 200 });
  }
}
