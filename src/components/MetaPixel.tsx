"use client";
import { Suspense, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { FbqFunction } from "@/types/fbq";

// Fallback loader — only runs if the server-rendered base snippet in
// app/layout.tsx wasn't present for some reason (e.g. the database was
// briefly unreachable when this page was rendered). Defines window.fbq the
// same way the real Facebook base code does, so tracking still has a
// chance to work instead of silently never loading.
function loadFacebookPixelFallback(pixelId: string) {
  if (window.fbq) return; // Base snippet already loaded — nothing to do.

  const fbq = function (...args: unknown[]) {
    if (fbq.callMethod) {
      fbq.callMethod(...args);
    } else {
      fbq.queue.push(args);
    }
  } as FbqFunction;

  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [];

  window.fbq = fbq;
  window._fbq = fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);

  fbq("init", pixelId);
  fbq("track", "PageView");
}

function MetaPixelInner({ pixelId }: { pixelId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // Tracks whether this is the very first render after a full page load.
  // The initial PageView is already fired by the inline snippet rendered
  // server-side in app/layout.tsx — firing it again here would double-count
  // that first visit in Meta's reporting.
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (pixelId || window.fbq) return; // Base snippet is already handling it.
    // No pixelId came from the server render — fall back to fetching it
    // client-side so tracking isn't silently dead for this visit.
    let cancelled = false;
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d.metaPixelId) return;
        loadFacebookPixelFallback(d.metaPixelId);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pixelId]);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    // Client-side route changes (this is a single-page app after the first
    // load) don't re-run the inline base snippet, so we fire PageView here
    // for every navigation after the first.
    if (!window.fbq) return;
    window.fbq("track", "PageView", { page_path: pathname });
  }, [pathname, searchParams]);

  return null;
}

export default function MetaPixel({ pixelId = "" }: { pixelId?: string }) {
  return (
    <Suspense fallback={null}>
      <MetaPixelInner pixelId={pixelId} />
    </Suspense>
  );
}
