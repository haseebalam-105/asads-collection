import { NextRequest, NextResponse } from "next/server";
import { dbGetOrderById, dbUpdateOrderStatus } from "@/lib/db/orders";

// Prevent Next.js from statically caching this route at build time so
// admin edits show up immediately without a redeploy.
export const dynamic = "force-dynamic";
export const revalidate = 0;


export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const order = await dbGetOrderById(params.id);
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ order });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { status, paymentStatus } = await req.json();
    const order = await dbUpdateOrderStatus(params.id, status, paymentStatus);
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

    try {
      const { sendOrderStatusUpdateEmail } = await import("@/lib/mail");
      await sendOrderStatusUpdateEmail(order);
    } catch {
      // email is optional
    }

    return NextResponse.json({ order });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
