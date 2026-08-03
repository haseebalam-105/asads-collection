import { notFound } from "next/navigation";
import BlogForm from "@/components/admin/BlogForm";
import { dbGetBlogPostById } from "@/lib/db/blog";
import { isDbConfigured } from "@/lib/db";

export default async function EditBlogPostPage({ params }: { params: { id: string } }) {
  if (!isDbConfigured()) {
    return (
      <div className="rounded-xl2 border border-gold/40 bg-gold/10 p-6 text-sm text-deep">
        MONGODB_URI is not set — connect a database to edit blog posts.
      </div>
    );
  }

  const post = await dbGetBlogPostById(params.id);
  if (!post) notFound();

  return (
    <div>
      <h1 className="mb-6 font-display text-xl font-extrabold text-ink">Edit Blog Post</h1>
      <BlogForm post={post} postId={post.id} />
    </div>
  );
}
