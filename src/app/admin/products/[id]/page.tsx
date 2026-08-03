import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { dbGetProductById } from "@/lib/db/products";
import { isDbConfigured } from "@/lib/db";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  if (!isDbConfigured()) {
    return (
      <div className="rounded-xl2 border border-gold/40 bg-gold/10 p-6 text-sm text-deep">
        MONGODB_URI is not set — connect a database to edit products.
      </div>
    );
  }

  const product = await dbGetProductById(params.id);
  if (!product) notFound();

  return (
    <div>
      <h1 className="mb-6 font-display text-xl font-extrabold text-ink">
        Edit Product
      </h1>
      <ProductForm product={product} productId={product.id} />
    </div>
  );
}
