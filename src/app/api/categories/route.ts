import { NextResponse } from "next/server";
import { getAllCategoriesAsync } from "@/lib/catalog";

// Public storefront categories endpoint — admin auth NOT required.
// Used by the storefront navbar / shop filters. Returns only active
// categories (the catalog helper already filters by default).
export async function GET() {
  const categories = await getAllCategoriesAsync({ includeInactive: false });
  return NextResponse.json({ categories });
}
