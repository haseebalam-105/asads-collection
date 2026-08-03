"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, Search, ShoppingCart, Globe } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { useCart } from "@/context/CartContext";
import { siteSettings } from "@/lib/settings";

export default function Navbar() {
  const { t, locale, setLocale } = useLanguage();
  const { itemCount, openDrawer } = useCart();
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
    <header className="sticky top-0 z-40 border-b border-mist-dark bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="focus-ring flex shrink-0 items-center gap-2">
          <div className="relative h-10 w-10 overflow-hidden rounded-full">
            <Image src={siteSettings.logoSrc} alt={siteSettings.brandName} fill className="object-cover" />
          </div>
          <span className="hidden font-display text-sm font-extrabold tracking-tight text-deep sm:block">
            {locale === "ur" ? siteSettings.brandNameUr : siteSettings.brandName}
          </span>
        </Link>

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

        <form
          onSubmit={handleSearch}
          className="relative hidden max-w-xs flex-1 md:block"
        >
          <Search
            size={16}
            className="absolute top-1/2 -translate-y-1/2 rtl:right-3 ltr:left-3 text-storm"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.nav.search}
            className="focus-ring w-full rounded-full border border-mist-dark bg-mist py-2 rtl:pr-9 rtl:pl-4 ltr:pl-9 ltr:pr-4 text-sm placeholder:text-storm"
          />
        </form>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLocale(locale === "en" ? "ur" : "en")}
            className="focus-ring hidden items-center gap-1 rounded-full border border-mist-dark px-3 py-1.5 text-xs font-semibold text-deep sm:flex"
            aria-label="Switch language"
          >
            <Globe size={14} />
            {locale === "en" ? "اردو" : "English"}
          </button>

          <button
            onClick={openDrawer}
            className="focus-ring relative rounded-full p-2 hover:bg-mist"
            aria-label="Open cart"
          >
            <ShoppingCart size={22} className="text-deep" />
            {itemCount > 0 && (
              <span className="absolute -top-1 rtl:-left-1 ltr:-right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[10px] font-bold text-white">
                {itemCount}
              </span>
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
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-y-0 rtl:left-0 ltr:right-0 flex w-72 flex-col gap-6 bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-extrabold text-deep">
                {siteSettings.brandName}
              </span>
              <button
                onClick={() => setMenuOpen(false)}
                className="focus-ring rounded-full p-1 hover:bg-mist"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSearch} className="relative">
              <Search size={16} className="absolute top-1/2 -translate-y-1/2 rtl:right-3 ltr:left-3 text-storm" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.nav.search}
                className="focus-ring w-full rounded-full border border-mist-dark bg-mist py-2 rtl:pr-9 rtl:pl-4 ltr:pl-9 ltr:pr-4 text-sm"
              />
            </form>

            <nav className="flex flex-col gap-1">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="focus-ring rounded-lg px-3 py-2.5 text-sm font-medium text-ink hover:bg-mist"
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            <button
              onClick={() => setLocale(locale === "en" ? "ur" : "en")}
              className="focus-ring flex items-center justify-center gap-2 rounded-full border border-mist-dark py-2.5 text-sm font-semibold text-deep"
            >
              <Globe size={16} />
              {locale === "en" ? "اردو میں دیکھیں" : "View in English"}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
