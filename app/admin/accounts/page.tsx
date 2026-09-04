import { BusinessAccountTable } from "@/components/admin/BusinessAccountTable";

export const metadata = { title: "Customers" };

export default function AdminAccountsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight text-navy">Wholesale customers</h1>
      <p className="mb-6 text-sm text-slate-600">
        Business accounts created through Clerk organizations. Tax-exempt flags skip sales tax at checkout.
      </p>
      <BusinessAccountTable />
    </div>
  );
}
