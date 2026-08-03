import HomeClient from "@/components/HomeClient";
import { getFeaturedProductsAsync } from "@/lib/catalog";

export default async function HomePage() {
  const featured = await getFeaturedProductsAsync();
  return <HomeClient featured={featured} />;
}
