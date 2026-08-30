import { NextRequest, NextResponse } from "next/server";
import { dbGetBlogPostById, dbUpdateBlogPost, dbDeleteBlogPost } from "@/lib/db/blog";

// Prevent Next.js from statically caching this route at build time so
// admin edits show up immediately without a redeploy.
export const dynamic = "force-dynamic";
export const revalidate = 0;


export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const post = await dbGetBlogPostById(params.id);
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ post });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const updates = await req.json();
    delete updates.id;
    delete updates.createdAt;
    const post = await dbUpdateBlogPost(params.id, updates);
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ post });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await dbDeleteBlogPost(params.id);
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
