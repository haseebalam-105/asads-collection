import ShopClient from "@/components/ShopClient";
import { getAllProductsAsync, getAllCategoriesAsync } from "@/lib/catalog";

export default async function ShopPage() {
  const [products, categories] = await Promise.all([
    getAllProductsAsync(),
    getAllCategoriesAsync({ includeInactive: false }),
  ]);
  return <ShopClient initialProducts={products} categories={categories} />;
}
