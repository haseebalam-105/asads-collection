"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  ShoppingBag,
  Banknote,
  Clock,
  CheckCircle2,
  XCircle,
  Users,
  AlertTriangle,
} from "lucide-react";
import { formatPKR } from "@/lib/format";

interface Stats {
  totalOrders: number;
  totalRevenue: number;
  pending: number;
  delivered: number;
  cancelled: number;
  totalCustomers: number;
  totalProducts: number;
  avgOrderValue: number;
  salesChart: { date: string; revenue: number }[];
  bestSellers: { name: string; units: number }[];
  lowStock: { name: string; stock: number }[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setStats(data);
      });
  }, []);

  if (error) {
    return (
      <div className="rounded-xl2 border border-gold/40 bg-gold/10 p-6 text-sm text-deep">
        <p className="font-semibold">Database not connected yet</p>
        <p className="mt-1 text-storm">{error}</p>
      </div>
    );
  }

  if (!stats) {
    return <p className="text-sm text-storm">Loading dashboard…</p>;
  }

  const cards = [
    { label: "Total Orders", value: stats.totalOrders, icon: ShoppingBag },
    { label: "Total Revenue", value: formatPKR(stats.totalRevenue), icon: Banknote },
    { label: "Pending Orders", value: stats.pending, icon: Clock },
    { label: "Delivered", value: stats.delivered, icon: CheckCircle2 },
    { label: "Cancelled", value: stats.cancelled, icon: XCircle },
    { label: "Total Customers", value: stats.totalCustomers, icon: Users },
  ];

  return (
    <div>
      <h1 className="mb-6 font-display text-xl font-extrabold text-ink">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="rounded-xl2 bg-white p-4 shadow-card">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-deep/5 text-deep">
                <Icon size={16} />
              </div>
              <p className="font-mono text-lg font-bold text-ink">{c.value}</p>
              <p className="text-[11px] text-storm">{c.label}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl2 bg-white p-5 shadow-card">
          <h2 className="mb-4 font-display text-sm font-bold text-ink">
            Revenue — Last 14 Days
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={stats.salesChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E9F1" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => formatPKR(v)} />
              <Line type="monotone" dataKey="revenue" stroke="#0B2A4A" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl2 bg-white p-5 shadow-card">
          <h2 className="mb-4 font-display text-sm font-bold text-ink">Best Sellers</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={stats.bestSellers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E9F1" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="units" fill="#C9973B" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {stats.lowStock.length > 0 && (
        <div className="mt-6 rounded-xl2 border border-gold/40 bg-gold/10 p-5">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle size={16} className="text-gold-deep" />
            <h2 className="font-display text-sm font-bold text-ink">Low Stock Alerts</h2>
          </div>
          <ul className="space-y-1 text-sm text-ink/80">
            {stats.lowStock.map((p) => (
              <li key={p.name} className="flex justify-between">
                <span>{p.name}</span>
                <span className="font-mono font-semibold text-deep">{p.stock} left</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
