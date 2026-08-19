"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil, Trash2, Search, Package } from "lucide-react";
import { Product } from "@/types/product";
import { formatPKR } from "@/lib/format";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setProducts(data.products);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    load();
  };

  const filtered = search.trim()
    ? products.filter(
        (p) =>
          p.name.en.toLowerCase().includes(search.toLowerCase()) ||
          p.sku.toLowerCase().includes(search.toLowerCase()) ||
          p.category.toLowerCase().includes(search.toLowerCase())
      )
    : products;

  if (error) {
    return (
      <div className="rounded-2xl border border-gold/30 bg-gradient-to-r from-gold/5 to-gold/10 p-8 text-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10">
            <Package size={20} className="text-gold-deep" />
          </div>
          <div>
            <p className="font-semibold text-deep">Database not connected yet</p>
            <p className="mt-0.5 text-storm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-xl font-extrabold text-ink">Products</h1>
          <p className="mt-1 text-sm text-storm">Manage your product catalog</p>
        </div>
        <Link
          href="/admin/products/new"
          className="focus-ring flex items-center gap-2 rounded-xl bg-deep px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-deep/20 transition-all hover:bg-deep-light hover:shadow-deep/30"
        >
          <Plus size={15} /> Add Product
        </Link>
      </div>

      <div className="mb-5">
        <div className="relative max-w-xs">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-storm" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="focus-ring w-full rounded-xl border border-mist-dark py-2.5 pl-10 pr-4 text-sm transition-colors hover:border-storm/40 focus:border-deep"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-sm text-storm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-deep border-t-transparent" />
          Loading…
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-mist-dark/60 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mist-dark bg-mist/50 text-left text-xs uppercase tracking-wide text-storm">
                <th className="px-5 py-3.5 font-semibold">Product</th>
                <th className="px-5 py-3.5 font-semibold">Category</th>
                <th className="px-5 py-3.5 font-semibold">Price</th>
                <th className="px-5 py-3.5 font-semibold">Stock</th>
                <th className="px-5 py-3.5 font-semibold">Featured</th>
                <th className="px-5 py-3.5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-mist-dark/50 last:border-0 transition-colors hover:bg-mist/30"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-mist ring-1 ring-mist-dark/40">
                        {p.images[0] && (
                          <Image src={p.images[0]} alt={p.name.en} fill className="object-cover" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-ink">{p.name.en}</p>
                        <p className="font-mono text-[11px] text-storm">{p.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-lg bg-mist px-2.5 py-1 text-xs font-medium text-ink/70">
                      {p.category}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-mono font-semibold text-ink">{formatPKR(p.price)}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                        p.stock <= 10
                          ? "bg-red-50 text-red-600"
                          : "bg-green-50 text-green-700"
                      }`}
                    >
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    {p.isFeatured ? (
                      <span className="rounded-lg bg-gold/10 px-2.5 py-1 text-xs font-semibold text-gold-deep">
                        Featured
                      </span>
                    ) : (
                      <span className="text-xs text-storm/50">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="rounded-lg p-2 text-storm transition-colors hover:bg-mist hover:text-deep"
                        aria-label="Edit"
                      >
                        <Pencil size={15} />
                      </Link>
                      <button
                        onClick={() => handleDelete(p.id, p.name.en)}
                        className="rounded-lg p-2 text-storm transition-colors hover:bg-red-50 hover:text-red-500"
                        aria-label="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-storm">
                    <Package size={32} className="mx-auto mb-3 text-mist-dark" />
                    <p className="font-medium">No products found</p>
                    <p className="mt-1 text-xs">Run <code className="rounded bg-mist px-1.5 py-0.5 font-mono text-xs">npm run seed</code> or add one.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
