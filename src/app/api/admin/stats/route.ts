import { NextResponse } from "next/server";
import { dbGetOrderStats } from "@/lib/db/orders";
import { dbGetAllProducts } from "@/lib/db/products";
import { dbGetCustomers } from "@/lib/db/customers";

// Prevent Next.js from statically caching this route at build time so
// admin edits show up immediately without a redeploy.
export const dynamic = "force-dynamic";
export const revalidate = 0;


export async function GET() {
  try {
    const [{ orders, totalOrders, totalRevenue, pending, delivered, cancelled }, products, customers] =
      await Promise.all([dbGetOrderStats(), dbGetAllProducts(), dbGetCustomers()]);

    // Last 14 days revenue, grouped by date
    const salesByDay = new Map<string, number>();
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      salesByDay.set(d.toISOString().slice(0, 10), 0);
    }
    for (const o of orders) {
      const key = o.createdAt.slice(0, 10);
      if (salesByDay.has(key)) {
        salesByDay.set(key, (salesByDay.get(key) || 0) + o.total);
      }
    }
    const salesChart = Array.from(salesByDay.entries()).map(([date, revenue]) => ({
      date: date.slice(5),
      revenue,
    }));

    // Best sellers by units sold
    const unitsSold = new Map<string, number>();
    for (const o of orders) {
      for (const item of o.items) {
        unitsSold.set(item.name.en, (unitsSold.get(item.name.en) || 0) + item.quantity);
      }
    }
    const bestSellers = Array.from(unitsSold.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, units]) => ({ name, units }));

    const lowStock = products.filter((p) => p.stock <= 10).map((p) => ({
      name: p.name.en,
      stock: p.stock,
    }));

    const avgOrderValue = totalOrders ? Math.round(totalRevenue / totalOrders) : 0;

    return NextResponse.json({
      totalOrders,
      totalRevenue,
      pending,
      delivered,
      cancelled,
      totalCustomers: customers.length,
      totalProducts: products.length,
      avgOrderValue,
      salesChart,
      bestSellers,
      lowStock,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
