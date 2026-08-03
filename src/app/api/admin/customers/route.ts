import { NextResponse } from "next/server";
import { dbGetCustomers } from "@/lib/db/customers";

export async function GET() {
  try {
    const customers = await dbGetCustomers();
    return NextResponse.json({ customers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
