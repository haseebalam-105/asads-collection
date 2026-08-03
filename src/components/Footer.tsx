"use client";

import Image from "next/image";
import Link from "next/link";
import { Facebook, MessageCircle, Mail, Phone, MapPin } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { siteSettings } from "@/lib/settings";

export default function Footer() {
  const { t, locale } = useLanguage();

  return (
    <footer className="border-t border-mist-dark bg-deep text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <div className="flex items-center gap-2">
            <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-gold/40">
              <Image src={siteSettings.logoSrc} alt={siteSettings.brandName} fill className="object-cover" />
            </div>
            <span className="font-display text-sm font-extrabold">
              {locale === "ur" ? siteSettings.brandNameUr : siteSettings.brandName}
            </span>
          </div>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
            {t.footer.about}
          </p>
          <div className="mt-5 flex items-center gap-3">
            <a
              href={siteSettings.facebook}
              className="focus-ring rounded-full bg-white/10 p-2 hover:bg-gold hover:text-deep"
              aria-label="Facebook"
            >
              <Facebook size={16} />
            </a>
            <a
              href={`https://wa.me/${siteSettings.whatsapp}`}
              className="focus-ring rounded-full bg-white/10 p-2 hover:bg-gold hover:text-deep"
              aria-label="WhatsApp"
            >
              <MessageCircle size={16} />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold">{t.footer.quickLinks}</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-white/70">
            <li><Link href="/" className="focus-ring hover:text-gold-light">{t.nav.home}</Link></li>
            <li><Link href="/shop" className="focus-ring hover:text-gold-light">{t.nav.shop}</Link></li>
            <li><Link href="/blog" className="focus-ring hover:text-gold-light">{t.nav.blog}</Link></li>
            <li><Link href="/track-order" className="focus-ring hover:text-gold-light">{t.nav.track}</Link></li>
            <li><Link href="/about" className="focus-ring hover:text-gold-light">{t.nav.about}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold">{t.footer.policies}</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-white/70">
            <li><Link href="/policies/shipping" className="focus-ring hover:text-gold-light">{t.footer.shipping}</Link></li>
            <li><Link href="/policies/returns" className="focus-ring hover:text-gold-light">{t.footer.returns}</Link></li>
            <li><Link href="/policies/privacy" className="focus-ring hover:text-gold-light">{t.footer.privacy}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-sm font-bold">{t.footer.contact}</h4>
          <ul className="mt-4 space-y-3 text-sm text-white/70">
            <li className="flex items-center gap-2">
              <Phone size={14} className="text-gold" /> {siteSettings.phone}
            </li>
            <li className="flex items-center gap-2">
              <Mail size={14} className="text-gold" /> {siteSettings.email}
            </li>
            <li className="flex items-center gap-2">
              <MapPin size={14} className="text-gold" /> {siteSettings.city}
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-xs text-white/50">
        © {new Date().getFullYear()} {siteSettings.brandName}. {t.footer.rights}
      </div>
    </footer>
  );
}
