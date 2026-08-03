"use client";

import { useState } from "react";
import { Phone, Mail, MapPin, MessageCircle, Send, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { siteSettings } from "@/lib/settings";

export default function ContactPage() {
  const { t, locale } = useLanguage();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Static contact form for now — wire this up to an email/CRM endpoint
    // once the backend is connected.
    setSent(true);
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-10 text-center font-display text-2xl font-extrabold text-ink">
        {t.nav.contact}
      </h1>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        <div className="space-y-5">
          <a
            href={`tel:${siteSettings.phone.replace(/\s/g, "")}`}
            className="focus-ring flex items-center gap-4 rounded-xl2 border border-mist-dark p-5 hover:border-deep"
          >
            <Phone size={20} className="text-deep" />
            <div>
              <p className="text-sm font-semibold text-ink">{siteSettings.phone}</p>
              <p className="text-xs text-storm">
                {locale === "ur" ? "کال کریں" : "Call us"}
              </p>
            </div>
          </a>
          <a
            href={`https://wa.me/${siteSettings.whatsapp}`}
            className="focus-ring flex items-center gap-4 rounded-xl2 border border-mist-dark p-5 hover:border-deep"
          >
            <MessageCircle size={20} className="text-deep" />
            <div>
              <p className="text-sm font-semibold text-ink">WhatsApp</p>
              <p className="text-xs text-storm">
                {locale === "ur" ? "فوری جواب" : "Fastest response"}
              </p>
            </div>
          </a>
          <a
            href={`mailto:${siteSettings.email}`}
            className="focus-ring flex items-center gap-4 rounded-xl2 border border-mist-dark p-5 hover:border-deep"
          >
            <Mail size={20} className="text-deep" />
            <div>
              <p className="text-sm font-semibold text-ink">{siteSettings.email}</p>
              <p className="text-xs text-storm">
                {locale === "ur" ? "ای میل کریں" : "Email us"}
              </p>
            </div>
          </a>
          <div className="flex items-center gap-4 rounded-xl2 border border-mist-dark p-5">
            <MapPin size={20} className="text-deep" />
            <p className="text-sm font-semibold text-ink">{siteSettings.city}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-xl2 border border-mist-dark p-6">
          {sent ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <CheckCircle2 size={40} className="text-green-500" />
              <p className="text-sm font-semibold text-ink">
                {locale === "ur" ? "پیغام بھیج دیا گیا!" : "Message sent!"}
              </p>
              <p className="text-xs text-storm">
                {locale === "ur" ? "ہم جلد رابطہ کریں گے۔" : "We'll get back to you shortly."}
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-storm">
                  {t.checkout.fullName}
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="focus-ring w-full rounded-lg border border-mist-dark px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-storm">
                  {t.checkout.email}
                </label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="focus-ring w-full rounded-lg border border-mist-dark px-4 py-2.5 text-sm"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-storm">
                  {locale === "ur" ? "پیغام" : "Message"}
                </label>
                <textarea
                  required
                  rows={4}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  className="focus-ring w-full rounded-lg border border-mist-dark px-4 py-2.5 text-sm"
                />
              </div>
              <button
                type="submit"
                className="focus-ring flex w-full items-center justify-center gap-2 rounded-full bg-deep py-3 text-sm font-bold text-white"
              >
                <Send size={15} />
                {locale === "ur" ? "بھیجیں" : "Send Message"}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
