import { InventoryTable } from "@/components/admin/InventoryTable";

export const metadata = { title: "Inventory" };

export default function AdminInventoryPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-navy">Inventory</h1>
      <p className="mb-6 text-sm text-slate-600">On-hand quantity versus reorder level. Status is derived from threshold.</p>
      <InventoryTable />
    </div>
  );
}
