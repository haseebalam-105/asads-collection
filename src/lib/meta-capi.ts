import crypto from "crypto";

// Meta requires certain user identifiers (email, phone) to be normalized
// and SHA-256 hashed before being sent to the Conversions API.
function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function hashEmail(email?: string): string | undefined {
  if (!email) return undefined;
  const normalized = email.trim().toLowerCase();
  if (!normalized) return undefined;
  return sha256(normalized);
}

function hashPhone(phone?: string): string | undefined {
  if (!phone) return undefined;
  // Meta wants digits only, including country code, no leading "+" or "00".
  let digits = phone.replace(/[^0-9]/g, "");
  if (!digits) return undefined;
  // Pakistani numbers are frequently entered as "03xxxxxxxxx" (11 digits,
  // local format) instead of the full "923xxxxxxxxx" international format.
  // Normalize so Meta can actually match the identifier.
  if (digits.length === 11 && digits.startsWith("0")) {
    digits = "92" + digits.slice(1);
  }
  return sha256(digits);
}

export interface MetaUserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  ip?: string;
  userAgent?: string;
  fbp?: string;
  fbc?: string;
}

export interface MetaContentItem {
  id: string;
  quantity: number;
  item_price?: number;
}

export interface MetaCustomData {
  currency?: string;
  value?: number;
  content_ids?: string[];
  content_name?: string;
  content_type?: string;
  contents?: MetaContentItem[];
  num_items?: number;
  order_id?: string;
}

export interface SendMetaEventOptions {
  pixelId?: string;
  accessToken?: string;
  testEventCode?: string;
  eventName: string;
  eventId?: string;
  eventSourceUrl?: string;
  actionSource?: "website" | "system_generated" | "other";
  userData: MetaUserData;
  customData?: MetaCustomData;
}

// Sends a single event to Meta's Conversions API (server-side tracking).
// This runs independently of the browser Pixel, so it still reaches Meta
// even when a customer has an ad blocker, iOS tracking prevention, or a
// slow/failed network request for fbevents.js. When eventId matches the
// eventID used in the browser fbq() call for the same action, Meta
// deduplicates the two into a single event instead of double counting.
export async function sendMetaEvent(opts: SendMetaEventOptions): Promise<
  { skipped: true } | { ok: boolean; status: number; body: unknown }
> {
  const { pixelId, accessToken, testEventCode, eventName, eventId, eventSourceUrl, userData, customData } = opts;

  if (!pixelId || !accessToken) {
    // Tracking isn't configured yet — silently no-op rather than erroring,
    // so the rest of the app (checkout, cart, etc.) never breaks because of
    // missing ad-tracking credentials.
    return { skipped: true };
  }

  const user_data: Record<string, unknown> = {};
  const em = hashEmail(userData.email);
  const ph = hashPhone(userData.phone);
  if (em) user_data.em = [em];
  if (ph) user_data.ph = [ph];
  if (userData.firstName) user_data.fn = [sha256(userData.firstName.trim().toLowerCase())];
  if (userData.lastName) user_data.ln = [sha256(userData.lastName.trim().toLowerCase())];
  if (userData.city) user_data.ct = [sha256(userData.city.trim().toLowerCase().replace(/\s/g, ""))];
  if (userData.ip) user_data.client_ip_address = userData.ip;
  if (userData.userAgent) user_data.client_user_agent = userData.userAgent;
  if (userData.fbp) user_data.fbp = userData.fbp;
  if (userData.fbc) user_data.fbc = userData.fbc;

  const payload = {
    data: [
      {
        event_name: eventName,
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        event_source_url: eventSourceUrl,
        action_source: opts.actionSource || "website",
        user_data,
        custom_data: customData,
      },
    ],
    ...(testEventCode ? { test_event_code: testEventCode } : {}),
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/${encodeURIComponent(pixelId)}/events?access_token=${encodeURIComponent(
        accessToken
      )}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      // Log server-side only — a failed ad-tracking call should never
      // surface as an error to the customer.
      console.error("Meta Conversions API error:", res.status, body);
    }
    return { ok: res.ok, status: res.status, body };
  } catch (err) {
    console.error("Meta Conversions API request failed:", err);
    return { ok: false, status: 0, body: null };
  }
}
