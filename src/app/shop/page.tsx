import ShopClient from "@/components/ShopClient";
import { getAllProductsAsync } from "@/lib/catalog";

export default async function ShopPage() {
  const products = await getAllProductsAsync();
  return <ShopClient initialProducts={products} />;
}
