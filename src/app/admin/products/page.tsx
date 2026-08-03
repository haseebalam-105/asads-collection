"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Product } from "@/types/product";
import { formatPKR } from "@/lib/format";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-xl font-extrabold text-ink">Products</h1>
        <Link
          href="/admin/products/new"
          className="focus-ring flex items-center gap-1.5 rounded-full bg-deep px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus size={15} /> Add Product
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-storm">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl2 bg-white shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-mist-dark text-left text-xs uppercase tracking-wide text-storm">
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Featured</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-mist-dark last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-mist">
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
                  <td className="px-4 py-3 capitalize text-ink/70">{p.category.replace("-", " ")}</td>
                  <td className="px-4 py-3 font-mono text-ink">{formatPKR(p.price)}</td>
                  <td className="px-4 py-3">
                    <span className={p.stock <= 10 ? "font-semibold text-red-500" : "text-ink/70"}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {p.isFeatured ? (
                      <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-green-700">
                        Yes
                      </span>
                    ) : (
                      <span className="text-xs text-storm">No</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="focus-ring rounded-full p-1.5 text-storm hover:bg-mist hover:text-deep"
                        aria-label="Edit"
                      >
                        <Pencil size={15} />
                      </Link>
                      <button
                        onClick={() => handleDelete(p.id, p.name.en)}
                        className="focus-ring rounded-full p-1.5 text-storm hover:bg-red-50 hover:text-red-500"
                        aria-label="Delete"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-storm">
                    No products yet. Run <code className="font-mono">npm run seed</code> or add one.
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
