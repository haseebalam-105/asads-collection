"use client";
import { useEffect, useState } from "react";
import { Save, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

interface SettingsForm {
  brandName: string; brandNameUr: string; logoSrc: string;
  deliveryFee: number; freeDeliveryThreshold: number;
  phone: string; whatsapp: string; email: string;
  facebook: string; city: string; metaPixelId: string;
  metaAccessToken: string; metaTestEventCode: string;
}

const defaultForm: SettingsForm = {
  brandName: "", brandNameUr: "", logoSrc: "/images/logo-new.jpeg",
  deliveryFee: 200, freeDeliveryThreshold: 3000,
  phone: "", whatsapp: "", email: "", facebook: "", city: "", metaPixelId: "",
  metaAccessToken: "", metaTestEventCode: "",
};

export default function AdminSettingsPage() {
  const [form, setForm] = useState<SettingsForm | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings", { cache: "no-store" }).then(r => r.json()).then(d => {
      if (d.error) setError(d.error); else setForm({ ...defaultForm, ...d.settings });
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!form) return;
    setSaving(true); setError("");
    try {
      const res = await fetch("/api/admin/settings", { method: "PUT", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.error) {
        setError(data?.error || `Save failed (status ${res.status}).`);
      } else {
        setForm({ ...defaultForm, ...data.settings });
        setSaved(true); setTimeout(() => setSaved(false), 2500);
      }
    } catch { setError("Failed to save settings — check your network connection."); }
    setSaving(false);
  };

  if (error && !form) return (<div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700"><p className="font-semibold">Database not connected</p><p className="mt-1 text-red-500">{error}</p></div>);
  if (!form) return (<div className="flex items-center gap-3 rounded-2xl border border-mist-dark bg-white p-8 shadow-card"><Loader2 size={20} className="animate-spin text-deep" /><span className="text-sm text-storm">Loading settings…</span></div>);

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="font-display text-xl font-extrabold text-ink">Settings</h1>
      <form onSubmit={handleSubmit} className="space-y-6 rounded-2xl border border-mist-dark bg-white p-6 shadow-card">
        <div className="flex items-center gap-2 border-b border-mist-dark pb-3">
          <AlertCircle size={16} className="text-deep" />
          <h2 className="font-display text-sm font-bold text-ink">General</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Brand Name (English)" value={form.brandName} onChange={(v) => setForm((f) => f ? { ...f, brandName: v } : f)} />
          <Field label="Brand Name (Urdu)" value={form.brandNameUr} onChange={(v) => setForm((f) => f ? { ...f, brandNameUr: v } : f)} />
          <Field label="Phone Number" value={form.phone} onChange={(v) => setForm((f) => f ? { ...f, phone: v } : f)} />
          <Field label="WhatsApp Number" value={form.whatsapp} onChange={(v) => setForm((f) => f ? { ...f, whatsapp: v } : f)} hint="No + sign, no spaces" />
          <Field label="Support Email" value={form.email} onChange={(v) => setForm((f) => f ? { ...f, email: v } : f)} />
          <Field label="Business City" value={form.city} onChange={(v) => setForm((f) => f ? { ...f, city: v } : f)} />
          <div className="sm:col-span-2"><Field label="Facebook URL" value={form.facebook} onChange={(v) => setForm((f) => f ? { ...f, facebook: v } : f)} /></div>
          <Field label="Delivery Fee (PKR)" type="number" value={String(form.deliveryFee)} onChange={(v) => setForm((f) => f ? { ...f, deliveryFee: Number(v) } : f)} />
          <Field label="Free Delivery Above (PKR)" type="number" value={String(form.freeDeliveryThreshold)} onChange={(v) => setForm((f) => f ? { ...f, freeDeliveryThreshold: Number(v) } : f)} />
        </div>

        <div className="flex items-center gap-2 border-t border-mist-dark pt-4">
          <AlertCircle size={16} className="text-gold" />
          <h2 className="font-display text-sm font-bold text-ink">Tracking &amp; Ads</h2>
        </div>
        <Field label="Meta (Facebook) Pixel ID" value={form.metaPixelId} onChange={(v) => setForm((f) => f ? { ...f, metaPixelId: v } : f)} placeholder="e.g. 123456789012345" hint="Get this from Facebook Events Manager. Leave empty to disable." />
        <Field
          label="Meta Conversions API Access Token"
          type="password"
          value={form.metaAccessToken}
          onChange={(v) => setForm((f) => (f ? { ...f, metaAccessToken: v } : f))}
          placeholder="EAAG..."
          hint="Events Manager → your Pixel → Settings → Conversions API → Generate access token. Required for server-side tracking (AddToCart, InitiateCheckout, Purchase) so ads still get data even with ad blockers or iOS privacy settings."
        />
        <Field
          label="Test Event Code"
          value={form.metaTestEventCode}
          onChange={(v) => setForm((f) => (f ? { ...f, metaTestEventCode: v } : f))}
          placeholder="TEST12345 (optional)"
          hint="Paste this temporarily from Events Manager → Test Events to verify events are arriving, then remove it — leaving it in place stops events from being used for ad delivery."
        />

        {error && <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"><AlertCircle size={14} />{error}</div>}

        <button type="submit" disabled={saving} className="focus-ring flex items-center gap-2 rounded-full bg-deep px-6 py-3 text-sm font-bold text-white shadow-lg shadow-deep/15 transition-all hover:bg-deep-light disabled:opacity-60">
          {saving ? <Loader2 size={16} className="animate-spin" /> : saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
          {saved ? "Saved Successfully!" : "Save Settings"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, hint }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; hint?: string; }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-storm">{label}</label>
      <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="focus-ring w-full rounded-xl border border-mist-dark bg-white px-4 py-2.5 text-sm text-ink outline-none transition-all focus:border-deep/30 focus:ring-2 focus:ring-deep/10" />
      {hint && <p className="mt-1 text-xs text-storm">{hint}</p>}
    </div>
  );
}