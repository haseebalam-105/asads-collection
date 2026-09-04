"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  BadgeCheck,
  Star,
  Sparkles,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Premium hero section — general e-commerce message for a multi-category
 * marketplace. Showcases a layered collage of DIFFERENT product types
 * (not just rain gear) so the visitor immediately understands the store
 * sells variety.
 *
 * The product images are loaded from the actual featured products in the
 * DB (passed as props from the server component) so the hero always
 * reflects real, current inventory. Falls back to the static seed images
 * if no featured products have images.
 */

interface HeroProduct {
  slug: string;
  name: string;
  image: string;
  price: number;
}

export default function Hero({
  featuredProducts = [],
}: {
  featuredProducts?: HeroProduct[];
}) {
  const { t } = useLanguage();

  // Pick up to 4 diverse products for the collage. Prefer products with
  // Cloudinary URLs (admin-uploaded) so the hero shows real, current
  // inventory rather than just the static seed images.
  const collageProducts = featuredProducts.slice(0, 4);

  // Fallback static images if no DB products are available.
  const fallbackImages = [
    { slug: "rain-suit", name: "Rain Suit", image: "/images/rain-suit.jpeg", price: 2799 },
    { slug: "car-cover", name: "Car Cover", image: "/images/car-cover.jpeg", price: 4499 },
    { slug: "bike-cover", name: "Bike Cover", image: "/images/bike-cover.jpeg", price: 1899 },
    { slug: "bedsheet", name: "Bedsheet Cover", image: "/images/bedsheet-cover.jpeg", price: 1599 },
  ];

  const showcase = collageProducts.length > 0 ? collageProducts : fallbackImages;
  const primary = showcase[0];
  const secondary = showcase[1] || showcase[0];
  const tertiary = showcase[2] || showcase[0];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-ink via-deep to-deep-light">
      {/* Subtle ambient texture — restrained dot grid, not a blob */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Subtle gold glow top-right */}
      <div
        className="absolute -top-32 ltr:right-0 rtl:left-0 h-[400px] w-[400px] rounded-full opacity-10 blur-3xl"
        style={{ background: "radial-gradient(circle, #E4C170, transparent 70%)" }}
      />

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-8 lg:px-8 lg:py-24">
        {/* ---- Left: copy ---- */}
        <div className="text-center lg:text-left">
          <motion.span
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-white/5 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-gold-light backdrop-blur-sm"
          >
            <Sparkles size={13} />
            {t.hero.eyebrow}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-5 whitespace-pre-line font-display text-4xl font-extrabold leading-[1.1] text-white sm:text-5xl lg:text-[3.5rem]"
          >
            {t.hero.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-white/70 lg:mx-0"
          >
            {t.hero.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:items-start"
          >
            <Link
              href="/shop"
              className="focus-ring group flex w-full items-center justify-center gap-2 rounded-full bg-gold px-7 py-3.5 text-sm font-bold text-deep shadow-lg shadow-gold/20 transition-all hover:scale-[1.02] hover:shadow-gold/30 sm:w-auto"
            >
              {t.hero.ctaShop}
              <ArrowRight
                size={16}
                className="rtl:rotate-180 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1"
              />
            </Link>
            <Link
              href="/shop"
              className="focus-ring flex w-full items-center justify-center rounded-full border border-white/25 px-7 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto"
            >
              {t.hero.ctaExplore}
            </Link>
          </motion.div>

          {/* Trust stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mx-auto mt-10 grid max-w-md grid-cols-3 gap-4 border-t border-white/10 pt-6 lg:mx-0"
          >
            {[
              { value: "500+", label: t.hero.stat1 },
              { value: "4,000+", label: t.hero.stat2 },
              { value: "2–5d", label: t.hero.stat3 },
            ].map((s) => (
              <div key={s.label} className="text-center lg:text-left">
                <div className="font-display text-2xl font-extrabold text-gold-light">
                  {s.value}
                </div>
                <div className="mt-0.5 text-[11px] uppercase tracking-wide text-white/50">
                  {s.label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ---- Right: multi-product collage ---- */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative mx-auto hidden h-[440px] w-full max-w-md lg:block"
        >
          {/* Back card — secondary product (top-left, tilted) */}
          <motion.div
            initial={{ rotate: -8, y: 30, opacity: 0 }}
            animate={{ rotate: -8, y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            whileHover={{ rotate: -6, y: -4 }}
            className="absolute left-0 top-12 h-64 w-52 overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl"
          >
            <Image
              src={secondary.image}
              alt={secondary.name}
              fill
              sizes="208px"
              className="object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-ink/80 to-transparent p-3">
              <p className="truncate text-xs font-bold text-white">{secondary.name}</p>
              <p className="font-mono text-[10px] text-gold-light">Rs. {secondary.price.toLocaleString()}</p>
            </div>
          </motion.div>

          {/* Front card — primary product (center-right, larger) */}
          <motion.div
            initial={{ rotate: 4, y: 40, opacity: 0 }}
            animate={{ rotate: 4, y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            whileHover={{ y: -6, rotate: 2, scale: 1.02 }}
            className="absolute right-0 top-0 h-80 w-64 overflow-hidden rounded-2xl border border-white/15 bg-white shadow-2xl"
          >
            <Image
              src={primary.image}
              alt={primary.name}
              fill
              sizes="256px"
              className="object-cover"
              priority
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-ink/90 to-transparent p-4">
              <div className="flex items-center gap-1 text-gold">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} size={11} className="fill-gold" />
                ))}
              </div>
              <p className="mt-1 truncate text-sm font-bold text-white">{primary.name}</p>
              <p className="font-mono text-xs text-gold-light">
                Rs. {primary.price.toLocaleString()}
              </p>
            </div>
          </motion.div>

          {/* Bottom card — tertiary product (bottom-center, small, peeking) */}
          <motion.div
            initial={{ rotate: -3, y: 50, opacity: 0 }}
            animate={{ rotate: -3, y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            whileHover={{ y: -4, rotate: 0 }}
            className="absolute bottom-0 left-16 h-44 w-36 overflow-hidden rounded-xl border border-white/15 bg-white shadow-xl"
          >
            <Image
              src={tertiary.image}
              alt={tertiary.name}
              fill
              sizes="144px"
              className="object-cover"
            />
          </motion.div>

          {/* Floating trust badge — quality */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.7 }}
            className="absolute right-2 top-4 flex items-center gap-2 rounded-xl border border-white/15 bg-white/95 px-3 py-2 shadow-xl backdrop-blur"
          >
            <ShieldCheck size={16} className="text-deep" />
            <div>
              <p className="text-[10px] font-bold text-ink">Quality</p>
              <p className="text-[8px] text-storm">Guaranteed</p>
            </div>
          </motion.div>

          {/* Floating trust badge — delivery */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.8 }}
            className="absolute bottom-20 right-8 flex items-center gap-2 rounded-xl border border-white/15 bg-white/95 px-3 py-2 shadow-xl backdrop-blur"
          >
            <Truck size={16} className="text-deep" />
            <div>
              <p className="text-[10px] font-bold text-ink">Fast</p>
              <p className="text-[8px] text-storm">Delivery</p>
            </div>
          </motion.div>

          {/* Floating badge — COD */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.9 }}
            className="absolute left-4 bottom-32 flex items-center gap-1.5 rounded-lg border border-gold/30 bg-gold/95 px-3 py-1.5 shadow-lg"
          >
            <BadgeCheck size={14} className="text-deep" />
            <span className="text-[10px] font-bold text-deep">COD</span>
          </motion.div>
        </motion.div>
      </div>

      {/* Category strip — shows this is a multi-category store */}
      <div className="relative border-t border-white/10 bg-deep/50 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-6 px-4 py-3 sm:gap-10 sm:px-6 lg:px-8">
          {[
            "Rain Gear",
            "Auto Accessories",
            "Home Essentials",
            "Lifestyle",
          ].map((cat, i) => (
            <motion.span
              key={cat}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.6 + i * 0.1 }}
              className="text-[11px] font-medium text-white/60 sm:text-xs"
            >
              {cat}
            </motion.span>
          ))}
        </div>
      </div>
    </section>
  );
}
