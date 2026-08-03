"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CheckCircle2, Copy, Check } from "lucide-react";
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
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
      >
        <CheckCircle2 size={64} className="text-green-500" />
      </motion.div>

      <h1 className="mt-6 font-display text-2xl font-extrabold text-ink">
        {t.confirmation.title}
      </h1>
      <p className="mt-2 text-sm text-storm">{t.confirmation.subtitle}</p>

      <div className="mt-8 w-full rounded-xl2 border border-mist-dark bg-mist p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-storm">
          {t.confirmation.orderNumber}
        </p>
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className="font-mono text-xl font-bold text-deep">{params.id}</span>
          <button
            onClick={handleCopy}
            className="focus-ring rounded-full p-1.5 hover:bg-white"
            aria-label="Copy order number"
          >
            {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} className="text-storm" />}
          </button>
        </div>
        <p className="mt-2 text-xs text-storm">{t.confirmation.trackHint}</p>
      </div>

      <Link
        href="/"
        className="focus-ring mt-8 rounded-full bg-deep px-6 py-3 text-sm font-semibold text-white"
      >
        {t.confirmation.backHome}
      </Link>
    </div>
  );
}
