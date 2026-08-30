"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Lock, ShieldCheck } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

export default function AdminLoginPage() {
  const router = useRouter();
  const siteSettings = useSettings();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      router.push("/admin");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-deep via-deep to-deep-light px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-gold/5 blur-3xl" />
        <div className="absolute -right-32 -bottom-32 h-96 w-96 rounded-full bg-gold/5 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-white/95 p-8 shadow-2xl shadow-black/20 backdrop-blur-xl">
        <div className="mb-8 flex flex-col items-center">
          <div className="relative h-16 w-16 overflow-hidden rounded-2xl ring-2 ring-gold/20 shadow-lg">
            <Image src={siteSettings.logoSrc} alt={siteSettings.brandName} fill className="object-cover" />
          </div>
          <h1 className="mt-4 font-display text-lg font-bold text-ink">Admin Login</h1>
          <p className="mt-1 text-xs text-storm">Sign in to {siteSettings.brandName} dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-storm">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              className="focus-ring w-full rounded-xl border border-mist-dark bg-white/80 px-4 py-3 text-sm transition-all hover:border-storm/40 focus:border-deep"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-storm">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="focus-ring w-full rounded-xl border border-mist-dark bg-white/80 px-4 py-3 text-sm transition-all hover:border-storm/40 focus:border-deep"
            />
          </div>
          {error && (
            <div className="rounded-xl bg-red-50 px-4 py-2.5 text-xs font-medium text-red-600">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl bg-deep py-3.5 text-sm font-bold text-white shadow-lg shadow-deep/25 transition-all duration-200 hover:bg-deep-light hover:shadow-deep/35 active:scale-[0.98] disabled:opacity-60 disabled:shadow-none"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />}
            Log In
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-storm/50">
          <ShieldCheck size={11} />
          <span>Protected admin area</span>
        </div>
      </div>
    </div>
  );
}
