"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";

export default function ReturnsPolicyPage() {
  const { t } = useLanguage();
  const siteSettings = useSettings();
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-6 font-display text-2xl font-extrabold text-ink">
        {t.footer.returns}
      </h1>
      <div className="space-y-4 text-sm leading-relaxed text-ink/80">
        <p>Unused products in their original packaging can be returned within 7 days of delivery.</p>
        <p>To start a return, message us on WhatsApp at {siteSettings.phone} with your order number and reason for return — we&apos;ll arrange a pickup.</p>
        <p>Refunds for Cash on Delivery orders are issued as store credit or bank transfer, processed within 5–7 business days after we receive the returned item.</p>
        <p>Products damaged from normal use, or without original packaging, are not eligible for return.</p>
      </div>
    </div>
  );
}
