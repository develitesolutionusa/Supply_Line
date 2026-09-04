import { AdminOrderTable } from "@/components/admin/AdminOrderTable";

export const metadata = { title: "Orders" };

export default function AdminOrdersPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-navy">Orders</h1>
      <AdminOrderTable />
    </div>
  );
}
