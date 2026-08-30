import { NextResponse } from "next/server";
import { dbGetCustomers } from "@/lib/db/customers";

// Prevent Next.js from statically caching this route at build time so
// admin edits show up immediately without a redeploy.
export const dynamic = "force-dynamic";
export const revalidate = 0;


export async function GET() {
  try {
    const customers = await dbGetCustomers();
    return NextResponse.json({ customers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
