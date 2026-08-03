"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader2, Lock } from "lucide-react";
import { siteSettings } from "@/lib/settings";

export default function AdminLoginPage() {
  const router = useRouter();
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
    <div className="flex min-h-screen items-center justify-center bg-deep px-4">
      <div className="w-full max-w-sm rounded-xl2 bg-white p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center">
          <div className="relative h-14 w-14 overflow-hidden rounded-full">
            <Image src={siteSettings.logoSrc} alt={siteSettings.brandName} fill className="object-cover" />
          </div>
          <h1 className="mt-3 font-display text-lg font-bold text-ink">Admin Login</h1>
          <p className="text-xs text-storm">{siteSettings.brandName}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-storm">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="focus-ring w-full rounded-lg border border-mist-dark px-4 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-storm">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="focus-ring w-full rounded-lg border border-mist-dark px-4 py-2.5 text-sm"
            />
          </div>
          {error && <p className="text-xs font-medium text-red-500">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="focus-ring flex w-full items-center justify-center gap-2 rounded-full bg-deep py-3 text-sm font-bold text-white disabled:opacity-60"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />}
            Log In
          </button>
        </form>
      </div>
    </div>
  );
}
