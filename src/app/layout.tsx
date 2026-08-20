import type { Metadata } from "next";
import { Manrope, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/context/LanguageContext";
import { CartProvider } from "@/context/CartContext";
import SiteChrome from "@/components/SiteChrome";

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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${manrope.variable} ${inter.variable} ${plexMono.variable}`}>
      <body>
        <LanguageProvider>
          <CartProvider>
            <SiteChrome>{children}</SiteChrome>
          </CartProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}