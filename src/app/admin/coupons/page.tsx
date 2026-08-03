"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Coupon } from "@/types/product";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: "",
    type: "percentage" as "percentage" | "fixed",
    value: 10,
    minOrderValue: 0,
    expiresAt: "",
  });

  const load = () => {
    fetch("/api/admin/coupons")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setCoupons(data.coupons);
      });
  };

  useEffect(load, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, expiresAt: form.expiresAt || null }),
    });
    setForm({ code: "", type: "percentage", value: 10, minOrderValue: 0, expiresAt: "" });
    load();
    setSaving(false);
  };

  const toggleActive = async (c: Coupon) => {
    await fetch(`/api/admin/coupons/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !c.active }),
    });
    load();
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("Delete this coupon?")) return;
    await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    load();
  };

  if (error) {
    return (
      <div className="rounded-xl2 border border-gold/40 bg-gold/10 p-6 text-sm text-deep">
        <p className="font-semibold">Database not connected yet</p>
        <p className="mt-1 text-storm">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="mb-6 font-display text-xl font-extrabold text-ink">Coupons</h1>

      <form
        onSubmit={handleCreate}
        className="mb-6 grid grid-cols-2 gap-3 rounded-xl2 bg-white p-5 shadow-card sm:grid-cols-5"
      >
        <input
          required
          placeholder="CODE"
          value={form.code}
          onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
          className="focus-ring rounded-lg border border-mist-dark px-3 py-2 text-sm font-mono uppercase"
        />
        <select
          value={form.type}
          onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as any }))}
          className="focus-ring rounded-lg border border-mist-dark px-3 py-2 text-sm"
        >
          <option value="percentage">% Off</option>
          <option value="fixed">Fixed (PKR)</option>
        </select>
        <input
          required
          type="number"
          placeholder="Value"
          value={form.value}
          onChange={(e) => setForm((f) => ({ ...f, value: Number(e.target.value) }))}
          className="focus-ring rounded-lg border border-mist-dark px-3 py-2 text-sm"
        />
        <input
          type="number"
          placeholder="Min order (PKR)"
          value={form.minOrderValue}
          onChange={(e) => setForm((f) => ({ ...f, minOrderValue: Number(e.target.value) }))}
          className="focus-ring rounded-lg border border-mist-dark px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <input
            type="date"
            value={form.expiresAt}
            onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
            className="focus-ring flex-1 rounded-lg border border-mist-dark px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={saving}
            className="focus-ring flex items-center justify-center rounded-lg bg-deep px-3 text-white disabled:opacity-60"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl2 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-mist-dark text-left text-xs uppercase tracking-wide text-storm">
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Min Order</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b border-mist-dark last:border-0">
                <td className="px-4 py-3 font-mono font-semibold text-deep">{c.code}</td>
                <td className="px-4 py-3 text-ink/70">
                  {c.type === "percentage" ? `${c.value}%` : `Rs. ${c.value}`}
                </td>
                <td className="px-4 py-3 text-ink/70">Rs. {c.minOrderValue}</td>
                <td className="px-4 py-3 text-ink/70">
                  {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "Never"}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleActive(c)}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      c.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {c.active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => deleteCoupon(c.id)}
                    className="focus-ring rounded-full p-1.5 text-storm hover:bg-red-50 hover:text-red-500"
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-storm">
                  No coupons yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
