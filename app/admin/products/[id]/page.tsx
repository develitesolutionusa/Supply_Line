import { notFound } from "next/navigation";
import { ProductEditor } from "@/components/admin/ProductEditor";
import { getProductById, listCategories } from "@/lib/catalog/query";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProductById(id, "business", true),
    listCategories(),
  ]);
  if (!product) notFound();
  return <ProductEditor product={product} categories={categories} />;
}
