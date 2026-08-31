"use client";
import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import type { FbqFunction } from "@/types/fbq";

// Loads Facebook's Pixel base code (matches the official snippet from Events
// Manager) and initializes it with the Pixel ID saved in the admin settings.
function loadFacebookPixel(pixelId: string) {
  if (window.fbq) {
    // Already loaded (e.g. from a fast client-side nav) — just re-init.
    window.fbq("init", pixelId);
    window.fbq("track", "PageView");
    return;
  }

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

function MetaPixelInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/settings", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled || !d.metaPixelId) return;
        loadFacebookPixel(d.metaPixelId);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!window.fbq) return;
    window.fbq("track", "PageView", { page_path: pathname });
  }, [pathname, searchParams]);

  return null;
}

export default function MetaPixel() {
  return (
    <Suspense fallback={null}>
      <MetaPixelInner />
    </Suspense>
  );
}
