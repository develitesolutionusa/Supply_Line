import { ProductEditor } from "@/components/admin/ProductEditor";
import { listCategories } from "@/lib/catalog/query";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const categories = await listCategories();
  return <ProductEditor categories={categories} />;
}
