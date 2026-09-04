import { AdminProductTable } from "@/components/admin/AdminProductTable";

export const metadata = { title: "Products" };

export default function AdminProductsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-navy">Products</h1>
      <AdminProductTable />
    </div>
  );
}
