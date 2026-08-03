"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function ShippingPolicyPage() {
  const { t } = useLanguage();
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-6 font-display text-2xl font-extrabold text-ink">
        {t.footer.shipping}
      </h1>
      <div className="space-y-4 text-sm leading-relaxed text-ink/80">
        <p>Orders are dispatched within 24 hours of confirmation from our Lahore warehouse.</p>
        <p>Standard delivery takes 2–5 business days depending on your city. Major cities (Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad) typically receive orders faster.</p>
        <p>A flat delivery fee applies to all orders, and is waived automatically on orders above the free-delivery threshold shown at checkout.</p>
        <p>You&apos;ll receive an order confirmation with your order number immediately after checkout, and can track your order status anytime using the Track Order page.</p>
      </div>
    </div>
  );
}
