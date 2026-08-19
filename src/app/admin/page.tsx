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
  TrendingUp,
  Package,
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
      <div className="rounded-2xl border border-gold/30 bg-gradient-to-r from-gold/5 to-gold/10 p-8 text-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10">
            <AlertTriangle size={20} className="text-gold-deep" />
          </div>
          <div>
            <p className="font-semibold text-deep">Database not connected yet</p>
            <p className="mt-0.5 text-storm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center gap-3 text-sm text-storm">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-deep border-t-transparent" />
        Loading dashboard…
      </div>
    );
  }

  const cards = [
    { label: "Total Orders", value: stats.totalOrders, icon: ShoppingBag, color: "bg-blue-50 text-blue-600" },
    { label: "Total Revenue", value: formatPKR(stats.totalRevenue), icon: Banknote, color: "bg-green-50 text-green-600" },
    { label: "Pending Orders", value: stats.pending, icon: Clock, color: "bg-amber-50 text-amber-600" },
    { label: "Delivered", value: stats.delivered, icon: CheckCircle2, color: "bg-emerald-50 text-emerald-600" },
    { label: "Cancelled", value: stats.cancelled, icon: XCircle, color: "bg-red-50 text-red-500" },
    { label: "Total Customers", value: stats.totalCustomers, icon: Users, color: "bg-purple-50 text-purple-600" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-xl font-extrabold text-ink">Dashboard</h1>
        <p className="mt-1 text-sm text-storm">Overview of your store performance</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="group rounded-2xl border border-mist-dark/60 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
            >
              <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${c.color}`}>
                <Icon size={18} />
              </div>
              <p className="font-mono text-lg font-bold text-ink">{c.value}</p>
              <p className="mt-0.5 text-xs text-storm">{c.label}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-mist-dark/60 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-display text-sm font-bold text-ink">
                Revenue — Last 14 Days
              </h2>
              <p className="mt-0.5 text-xs text-storm">Daily revenue trend</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600">
              <TrendingUp size={15} />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={stats.salesChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E9F1" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#4C6480" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#4C6480" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #E4E9F1",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  fontSize: "12px",
                }}
                formatter={(v: number) => formatPKR(v)}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#0B2A4A"
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: "#0B2A4A", strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-mist-dark/60 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-display text-sm font-bold text-ink">Best Sellers</h2>
              <p className="mt-0.5 text-xs text-storm">Top products by units sold</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Package size={15} />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.bestSellers} layout="vertical" barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4E9F1" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#4C6480" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 11, fill: "#4C6480" }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #E4E9F1",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="units" fill="#C9973B" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {stats.lowStock.length > 0 && (
        <div className="rounded-2xl border border-gold/30 bg-gradient-to-r from-gold/5 to-transparent p-6">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/10">
              <AlertTriangle size={16} className="text-gold-deep" />
            </div>
            <h2 className="font-display text-sm font-bold text-ink">Low Stock Alerts</h2>
          </div>
          <ul className="space-y-2">
            {stats.lowStock.map((p) => (
              <li
                key={p.name}
                className="flex items-center justify-between rounded-xl bg-white/60 px-4 py-2.5 text-sm"
              >
                <span className="text-ink/80">{p.name}</span>
                <span className="rounded-full bg-red-50 px-2.5 py-0.5 font-mono text-xs font-semibold text-red-600">
                  {p.stock} left
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}