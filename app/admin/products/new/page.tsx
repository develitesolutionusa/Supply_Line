import { ProductEditor } from "@/components/admin/ProductEditor";
import { listCategories } from "@/lib/catalog/query";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const categories = await listCategories();
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-navy">New product</h1>
      <ProductEditor categories={categories} />
    </div>
  );
}
