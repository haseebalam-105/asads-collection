"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Copy, Check, ArrowRight, Package } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function OrderConfirmationPage() {
  const params = useParams<{ id: string }>();
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(params.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center px-4 py-20 text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className="relative"
      >
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-green-50 shadow-lg shadow-green-500/10">
          <CheckCircle2 size={48} className="text-green-500" />
        </div>
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="absolute inset-0 rounded-3xl ring-4 ring-green-300/30"
        />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mt-8 font-display text-2xl font-extrabold text-ink"
      >
        {t.confirmation.title}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-2 text-sm leading-relaxed text-storm"
      >
        {t.confirmation.subtitle}
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-10 w-full rounded-2xl border border-mist-dark bg-gradient-to-br from-white to-mist/50 p-6 shadow-sm"
      >
        <div className="flex items-center justify-center gap-2">
          <Package size={14} className="text-storm" />
          <p className="text-xs font-semibold uppercase tracking-wider text-storm">
            {t.confirmation.orderNumber}
          </p>
        </div>
        <div className="mt-3 flex items-center justify-center gap-3">
          <span className="font-mono text-2xl font-bold text-deep">{params.id}</span>
          <button
            onClick={handleCopy}
            className="focus-ring rounded-xl border border-mist-dark p-2 transition-colors hover:bg-mist hover:text-deep"
            aria-label="Copy order number"
          >
            {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} className="text-storm" />}
          </button>
        </div>
        <p className="mt-2 text-xs text-storm">{t.confirmation.trackHint}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 flex flex-col items-center gap-3 sm:flex-row"
      >
        <Link
          href="/"
          className="focus-ring flex items-center gap-2 rounded-xl bg-deep px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-deep/20 transition-all hover:bg-deep-light"
        >
          {t.confirmation.backHome}
          <ArrowRight size={16} className="rtl:rotate-180" />
        </Link>
      </motion.div>
    </div>
  );
}
