"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

const DROPS = Array.from({ length: 18 }, (_, i) => ({
  left: `${(i * 97) % 100}%`,
  delay: (i % 9) * 0.35,
  duration: 2 + (i % 5) * 0.4,
}));

export default function Hero() {
  const { t } = useLanguage();

  return (
    <section className="relative overflow-hidden bg-deep">
      <div className="rain-layer">
        {DROPS.map((d, i) => (
          <span
            key={i}
            className="rain-drop"
            style={{
              left: d.left,
              animationDelay: `${d.delay}s`,
              animationDuration: `${d.duration}s`,
            }}
          />
        ))}
      </div>

      <div
        className="absolute -top-24 rtl:-left-24 ltr:-right-24 h-96 w-96 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #E4C170, transparent 70%)" }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-white/5 px-4 py-1.5 text-xs font-semibold text-gold-light"
          >
            <ShieldCheck size={14} />
            {t.hero.eyebrow}
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-6 font-display text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl"
          >
            {t.hero.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/70"
          >
            {t.hero.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              href="/shop"
              className="focus-ring group flex items-center gap-2 rounded-full bg-gold px-7 py-3 text-sm font-bold text-deep transition-transform hover:scale-105"
            >
              {t.hero.ctaShop}
              <ArrowRight size={16} className="rtl:rotate-180 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
            </Link>
            <Link
              href="/shop"
              className="focus-ring rounded-full border border-white/30 px-7 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              {t.hero.ctaExplore}
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mx-auto mt-14 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-8"
          >
            {[
              ["100%", t.hero.stat1],
              ["4,000+", t.hero.stat2],
              ["24h", t.hero.stat3],
            ].map(([value, label]) => (
              <div key={label}>
                <div className="font-display text-2xl font-extrabold text-gold-light">
                  {value}
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-wide text-white/50">
                  {label}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
