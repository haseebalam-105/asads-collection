import type { Metadata } from "next";
import { Manrope, Inter, IBM_Plex_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { CartProvider } from "@/context/CartContext";
import { SettingsProvider } from "@/context/SettingsContext";
import SiteChrome from "@/components/SiteChrome";
import { dbGetSettings } from "@/lib/db/settings";
import { isDbConfigured } from "@/lib/db";

// This layout reads the Meta Pixel ID from the database on every request
// (not just at build time) so admin changes take effect immediately —
// without this, Next.js could statically render the layout once at build
// time and "freeze" whatever Pixel ID existed then.
export const dynamic = "force-dynamic";
export const revalidate = 0;

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", weight: ["500", "700", "800"] });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", weight: ["400", "500", "600"] });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], variable: "--font-plex-mono", weight: ["400", "500"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://asad-collection.vercel.app"),
  title: { default: "Asad's Collection — Premium Rain Protection", template: "%s | Asad's Collection" },
  description: "Premium waterproof rain coats, bike covers, car covers and home protection products. 100% waterproof, fast delivery across Pakistan, Cash on Delivery.",
  openGraph: {
    title: "Asad's Collection — Premium Rain Protection",
    description: "Premium waterproof rain coats, bike covers, car covers and home protection products.",
    siteName: "Asad's Collection",
    type: "website",
    images: ["/images/logo-new.jpeg"],
  },
  icons: { icon: "/images/logo-new.jpeg" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let metaPixelId = "";
  try {
    if (isDbConfigured()) {
      const settings = await dbGetSettings();
      metaPixelId = settings.metaPixelId || "";
    }
  } catch {
    // DB unreachable at render time — site still renders fine, Pixel just
    // won't load for this request (client-side fallback fetch will retry).
  }

  // Facebook Pixel IDs are purely numeric — stripping anything else before
  // it's interpolated into an inline <script> is a basic safety measure.
  const cleanPixelId = metaPixelId.replace(/[^0-9]/g, "");

  return (
    <html lang="en" className={`${manrope.variable} ${inter.variable} ${plexMono.variable}`}>
      <body>
        {cleanPixelId && (
          <>
            {/*
              This is the same base Meta Pixel snippet shown in Facebook's
              own setup guide — the boilerplate JS is identical for every
              business; the Pixel ID is the only client-specific part, and
              it's inserted below from what's saved in /admin/settings.
              strategy="beforeInteractive" makes Next.js inject this into
              the page's initial HTML, before hydration — matching a
              hand-pasted <head> snippet rather than a post-load fetch.
            */}
            <Script
              id="meta-pixel-base"
              strategy="beforeInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  !function(f,b,e,v,n,t,s)
                  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                  n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)}(window, document,'script',
                  'https://connect.facebook.net/en_US/fbevents.js');
                  fbq('init', '${cleanPixelId}');
                  fbq('track', 'PageView');
                `,
              }}
            />
            <noscript>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${cleanPixelId}&ev=PageView&noscript=1`}
                alt=""
              />
            </noscript>
          </>
        )}
        <SettingsProvider>
          <LanguageProvider>
            <CartProvider>
              <SiteChrome metaPixelId={metaPixelId}>{children}</SiteChrome>
            </CartProvider>
          </LanguageProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}