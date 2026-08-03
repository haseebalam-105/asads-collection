import Link from "next/link";
import Image from "next/image";
import { getPublishedBlogPostsAsync } from "@/lib/blog";

export const metadata = {
  title: "Blog",
  description: "Rain protection tips, product guides and seasonal advice from Asad's Collection.",
};

export default async function BlogListPage() {
  const posts = await getPublishedBlogPostsAsync();

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-center font-display text-2xl font-extrabold text-ink sm:text-3xl">
        Blog
      </h1>
      <p className="mb-10 text-center text-sm text-storm">
        Rain protection tips, product guides and seasonal advice.
      </p>

      {posts.length === 0 ? (
        <p className="py-16 text-center text-sm text-storm">
          No articles published yet — check back soon.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="focus-ring group block overflow-hidden rounded-xl2 bg-white shadow-card transition-shadow hover:shadow-card-hover"
            >
              {post.coverImage && (
                <div className="relative aspect-video overflow-hidden bg-mist">
                  <Image
                    src={post.coverImage}
                    alt={post.title.en}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
              )}
              <div className="p-5">
                <p className="text-xs text-storm">
                  {new Date(post.createdAt).toLocaleDateString()}
                </p>
                <h2 className="mt-1 font-display text-base font-bold text-ink">
                  {post.title.en}
                </h2>
                <p className="mt-2 line-clamp-2 text-sm text-storm">{post.excerpt.en}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
