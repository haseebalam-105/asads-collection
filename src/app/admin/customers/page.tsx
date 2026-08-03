"use client";

import { useEffect, useState } from "react";
import { Customer } from "@/types/product";
import { formatPKR } from "@/lib/format";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/customers")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setCustomers(data.customers);
      });
  }, []);

  const filtered = customers.filter(
    (c) =>
      c.fullName.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search)
  );

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
      <h1 className="mb-6 font-display text-xl font-extrabold text-ink">Customers</h1>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or phone…"
        className="focus-ring mb-5 w-72 rounded-full border border-mist-dark px-4 py-2 text-sm"
      />

      <div className="overflow-x-auto rounded-xl2 bg-white shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-mist-dark text-left text-xs uppercase tracking-wide text-storm">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Total Spent</th>
              <th className="px-4 py-3">Last Order</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.phone} className="border-b border-mist-dark last:border-0">
                <td className="px-4 py-3 font-medium text-ink">{c.fullName}</td>
                <td className="px-4 py-3 text-ink/70">{c.phone}</td>
                <td className="px-4 py-3 text-ink/70">{c.city}</td>
                <td className="px-4 py-3 text-ink/70">{c.orderCount}</td>
                <td className="px-4 py-3 font-mono font-semibold text-deep">
                  {formatPKR(c.totalSpent)}
                </td>
                <td className="px-4 py-3 text-xs text-storm">
                  {new Date(c.lastOrderAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-storm">
                  No customers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
