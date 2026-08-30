"use client";

// Fires a Meta event through BOTH the browser Pixel (fast, but blocked by ad
// blockers / Safari ITP / iOS 14.5+ privacy settings) and the server-side
// Conversions API (reliable, always reaches Meta since it comes straight
// from our backend). Both calls use the same eventId so Meta's dedup logic
// treats them as one event instead of counting it twice.
//
// userData (email/phone) is only available on some events — e.g. we know
// the customer's phone/email at checkout/purchase, but not while they're
// just browsing a product page. Pass whatever you have; the rest is
// filled in server-side from IP address, user agent, and Meta's own
// _fbp/_fbc browser cookies.

function generateEventId(): string {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export interface MetaTrackCustomData {
  currency?: string;
  value?: number;
  content_ids?: string[];
  content_name?: string;
  content_type?: string;
  contents?: { id: string; quantity: number; item_price?: number }[];
  num_items?: number;
  order_id?: string;
}

export interface MetaTrackUserData {
  email?: string;
  phone?: string;
}

// Standard Meta Pixel event names this app uses:
// ViewContent, AddToCart, InitiateCheckout, Purchase.
export function trackMetaEvent(
  eventName: string,
  customData?: MetaTrackCustomData,
  userData?: MetaTrackUserData
): string {
  const eventId = generateEventId();

  // 1. Browser Pixel — same eventID passed so Meta can dedupe against CAPI.
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, customData || {}, { eventID: eventId });
  }

  // 2. Server-side Conversions API — sent via our own API route so the
  // Meta access token never has to be exposed to the browser.
  fetch("/api/meta-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      eventName,
      eventId,
      eventSourceUrl: typeof window !== "undefined" ? window.location.href : undefined,
      customData,
      email: userData?.email,
      phone: userData?.phone,
      fbp: getCookie("_fbp"),
      fbc: getCookie("_fbc"),
    }),
  }).catch(() => {
    // Best-effort — never block the UI if this fails.
  });

  return eventId;
}

// Fires the browser Pixel ONLY, using a specific eventId — for cases where
// the server has already sent the matching Conversions API event itself
// (e.g. Purchase, sent server-side right when the order is created) and we
// just need the browser-side half for Meta's deduplication + on-page signal,
// without posting to /api/meta-events a second time.
export function trackMetaPixelOnly(
  eventName: string,
  customData: MetaTrackCustomData | undefined,
  eventId: string
) {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, customData || {}, { eventID: eventId });
  }
}
