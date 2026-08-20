"use client";
import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
declare global { interface Window { fbq?: (...args: any[]) => void; _fbq?: any[]; } }

function MetaPixelInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    let c = false;
    fetch("/api/settings").then(r => r.json()).then(d => {
      if (c || !d.metaPixelId || window.fbq) return;
      window._fbq = []; window.fbq = function(...a: any[]) { window._fbq!.push(a); };
      window.fbq("init", d.metaPixelId); window.fbq("track", "PageView");
      const s = document.createElement("script"); s.src = "https://connect.facebook.net/en_US/fbevents.js"; s.async = true; document.head.appendChild(s);
    }).catch(() => {});
    return () => { c = true; };
  }, []);
  useEffect(() => { if (!window.fbq) return; window.fbq("track", "PageView", { page_path: pathname }); }, [pathname]);
  return null;
}
export default function MetaPixel() { return <Suspense fallback={null}><MetaPixelInner /></Suspense>; }