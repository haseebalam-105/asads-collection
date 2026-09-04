import HomeClient from "@/components/HomeClient";
import { getFeaturedProductsAsync, getAllCategoriesAsync } from "@/lib/catalog";

export default async function HomePage() {
  const [featured, categories] = await Promise.all([
    getFeaturedProductsAsync(),
    getAllCategoriesAsync({ includeInactive: false }),
  ]);
  return <HomeClient featured={featured} categories={categories} />;
}
