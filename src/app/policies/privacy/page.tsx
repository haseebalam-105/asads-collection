"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useSettings } from "@/context/SettingsContext";

export default function PrivacyPolicyPage() {
  const { t } = useLanguage();
  const siteSettings = useSettings();
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-6 font-display text-2xl font-extrabold text-ink">
        {t.footer.privacy}
      </h1>
      <div className="space-y-4 text-sm leading-relaxed text-ink/80">
        <p>We collect only the information needed to process your order: your name, phone number, email, and delivery address.</p>
        <p>Your information is used solely to fulfill and communicate about your order, and is never sold to third parties.</p>
        <p>Payment is handled entirely through Cash on Delivery — we do not store any card or bank details.</p>
        <p>For any privacy questions, contact us at {siteSettings.email}.</p>
      </div>
    </div>
  );
}
