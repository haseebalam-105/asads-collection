import { NextRequest, NextResponse } from "next/server";
import { dbGetOrders } from "@/lib/db/orders";
import { OrderStatus } from "@/types/product";

// Prevent Next.js from statically caching this route at build time so
// admin edits show up immediately without a redeploy.
export const dynamic = "force-dynamic";
export const revalidate = 0;


function toCsv(orders: Awaited<ReturnType<typeof dbGetOrders>>) {
  const header = ["Order ID", "Customer", "Phone", "Products", "Amount", "Status", "Date"];
  const rows = orders.map((o) => [
    o.orderNumber,
    o.customer.fullName,
    o.customer.phone,
    o.items.map((i) => `${i.name.en} x${i.quantity}`).join("; "),
    o.total,
    o.status,
    new Date(o.createdAt).toLocaleDateString(),
  ]);
  return [header, ...rows]
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

export async function GET(req: NextRequest) {
  try {
    const status = req.nextUrl.searchParams.get("status") as OrderStatus | null;
    const search = req.nextUrl.searchParams.get("search") || undefined;
    const exportFormat = req.nextUrl.searchParams.get("export");

    const orders = await dbGetOrders({ status: status || undefined, search });

    if (exportFormat === "csv") {
      return new NextResponse(toCsv(orders), {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="orders-${Date.now()}.csv"`,
        },
      });
    }

    return NextResponse.json({ orders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
