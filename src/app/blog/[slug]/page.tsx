import { notFound } from "next/navigation";
import Image from "next/image";
import { Metadata } from "next";
import { getBlogPostBySlugAsync } from "@/lib/blog";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getBlogPostBySlugAsync(params.slug);
  if (!post) return {};
  return {
    title: post.title.en,
    description: post.excerpt.en,
    openGraph: {
      title: post.title.en,
      description: post.excerpt.en,
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getBlogPostBySlugAsync(params.slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-2xl px-4 py-14 sm:px-6 lg:px-8">
      {post.coverImage && (
        <div className="relative mb-8 aspect-video overflow-hidden rounded-xl2 bg-mist">
          <Image src={post.coverImage} alt={post.title.en} fill className="object-cover" />
        </div>
      )}
      <p className="text-xs text-storm">{new Date(post.createdAt).toLocaleDateString()}</p>
      <h1 className="mt-2 font-display text-2xl font-extrabold text-ink sm:text-3xl">
        {post.title.en}
      </h1>
      <div className="mt-6 max-w-none whitespace-pre-line text-sm leading-relaxed text-ink/80">
        {post.content.en}
      </div>
    </article>
  );
}
