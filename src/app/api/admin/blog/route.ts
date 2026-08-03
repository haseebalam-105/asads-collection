import { NextRequest, NextResponse } from "next/server";
import { dbGetAllBlogPosts, dbCreateBlogPost } from "@/lib/db/blog";
import { BlogPost } from "@/types/product";

export async function GET() {
  try {
    const posts = await dbGetAllBlogPosts(false);
    return NextResponse.json({ posts });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.title?.en || !body.slug) {
      return NextResponse.json(
        { error: "title and slug are required." },
        { status: 400 }
      );
    }
    const post: BlogPost = {
      id: crypto.randomUUID(),
      slug: body.slug,
      title: body.title,
      excerpt: body.excerpt || { en: "", ur: "" },
      content: body.content || { en: "", ur: "" },
      coverImage: body.coverImage || "",
      published: body.published ?? false,
      createdAt: new Date().toISOString(),
    };
    await dbCreateBlogPost(post);
    return NextResponse.json({ post }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
