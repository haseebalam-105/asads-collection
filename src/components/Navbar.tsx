"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, Search, ShoppingCart, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { useSettings } from "@/context/SettingsContext";

export default function Navbar() {
  const { t, locale, setLocale } = useLanguage();
  const { itemCount, openDrawer } = useCart();
  const siteSettings = useSettings();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  const links = [
    { href: "/", label: t.nav.home },
    { href: "/shop", label: t.nav.shop },
    { href: "/blog", label: t.nav.blog },
    { href: "/about", label: t.nav.about },
    { href: "/contact", label: t.nav.contact },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(query ? `/shop?q=${encodeURIComponent(query)}` : "/shop");
    setMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-mist-dark bg-white/95 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="focus-ring flex shrink-0 items-center gap-2.5">
          <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-gold/20">
            <Image src={siteSettings.logoSrc} alt={siteSettings.brandName} fill className="object-cover" />
          </div>
          <div className="hidden sm:block">
            <span className="block font-display text-sm font-extrabold leading-tight text-deep">
              {locale === "ur" ? siteSettings.brandNameUr : siteSettings.brandName}
            </span>
            <span className="block text-[9px] uppercase tracking-wider text-gold">
              Quality · Trust · Variety
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-7 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="focus-ring text-sm font-medium text-ink/80 transition-colors hover:text-deep"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Search (desktop) */}
        <form onSubmit={handleSearch} className="relative hidden max-w-xs flex-1 md:block">
          <Search size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-3 rtl:right-3 text-storm" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.nav.search}
            className="focus-ring w-full rounded-full border border-mist-dark bg-mist py-2 ltr:pl-9 ltr:pr-4 rtl:pr-9 rtl:pl-4 text-sm placeholder:text-storm/60"
          />
        </form>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setLocale(locale === "en" ? "ur" : "en")}
            className="focus-ring hidden items-center gap-1 rounded-full border border-mist-dark px-3 py-1.5 text-xs font-semibold text-deep transition-colors hover:bg-mist sm:flex"
            aria-label="Switch language"
          >
            <Globe size={14} />
            {locale === "en" ? "اردو" : "EN"}
          </button>

          <button
            onClick={openDrawer}
            className="focus-ring relative rounded-full p-2 transition-colors hover:bg-mist"
            aria-label="Open cart"
          >
            <ShoppingCart size={22} className="text-deep" />
            {itemCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 ltr:-right-0.5 rtl:-left-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-bold text-white shadow-md"
              >
                {itemCount}
              </motion.span>
            )}
          </button>

          <button
            onClick={() => setMenuOpen(true)}
            className="focus-ring rounded-full p-2 hover:bg-mist lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={22} className="text-deep" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="absolute inset-y-0 ltr:right-0 rtl:left-0 flex w-80 max-w-[85vw] flex-col bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-mist-dark p-4">
                <span className="font-display text-sm font-extrabold text-deep">
                  {siteSettings.brandName}
                </span>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="focus-ring rounded-full p-1.5 hover:bg-mist"
                  aria-label="Close menu"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSearch} className="relative p-4">
                <Search size={16} className="absolute top-1/2 -translate-y-1/2 ltr:left-7 rtl:right-7 text-storm" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t.nav.search}
                  className="focus-ring w-full rounded-full border border-mist-dark bg-mist py-2.5 ltr:pl-10 ltr:pr-4 rtl:pr-10 rtl:pl-4 text-sm"
                />
              </form>

              <nav className="flex flex-1 flex-col gap-1 px-4">
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setMenuOpen(false)}
                    className="focus-ring rounded-lg px-3 py-3 text-sm font-medium text-ink hover:bg-mist"
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>

              <div className="border-t border-mist-dark p-4">
                <button
                  onClick={() => {
                    setLocale(locale === "en" ? "ur" : "en");
                    setMenuOpen(false);
                  }}
                  className="focus-ring flex w-full items-center justify-center gap-2 rounded-full border border-mist-dark py-2.5 text-sm font-semibold text-deep"
                >
                  <Globe size={16} />
                  {locale === "en" ? "اردو میں دیکھیں" : "View in English"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}
