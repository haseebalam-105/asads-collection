"use client";

import { useEffect, useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { siteSettings } from "@/lib/settings";

type SettingsForm = typeof siteSettings;

export default function AdminSettingsPage() {
  const [form, setForm] = useState<SettingsForm | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setForm(data.settings);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (error) {
    return (
      <div className="rounded-xl2 border border-gold/40 bg-gold/10 p-6 text-sm text-deep">
        <p className="font-semibold">Database not connected yet</p>
        <p className="mt-1 text-storm">{error}</p>
      </div>
    );
  }
  if (!form) return <p className="text-sm text-storm">Loading…</p>;

  const field = (key: keyof SettingsForm, label: string, type = "text") => (
    <div>
      <label className="mb-1.5 block text-xs font-semibold text-storm">{label}</label>
      <input
        type={type}
        value={form[key] as string | number}
        onChange={(e) =>
          setForm((f) =>
            f
              ? {
                  ...f,
                  [key]: type === "number" ? Number(e.target.value) : e.target.value,
                }
              : f
          )
        }
        className="focus-ring w-full rounded-lg border border-mist-dark px-4 py-2.5 text-sm"
      />
    </div>
  );

  return (
    <div className="max-w-2xl">
      <h1 className="mb-6 font-display text-xl font-extrabold text-ink">Settings</h1>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl2 bg-white p-6 shadow-card">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {field("brandName", "Brand Name (English)")}
          {field("brandNameUr", "Brand Name (Urdu)")}
          {field("deliveryFee", "Delivery Fee (PKR)", "number")}
          {field("freeDeliveryThreshold", "Free Delivery Above (PKR)", "number")}
          {field("phone", "Phone Number")}
          {field("whatsapp", "WhatsApp Number (no +, no spaces)")}
          {field("email", "Support Email")}
          {field("city", "Business City")}
          <div className="sm:col-span-2">{field("facebook", "Facebook URL")}</div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="focus-ring flex items-center gap-2 rounded-full bg-deep px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saved ? "Saved!" : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
