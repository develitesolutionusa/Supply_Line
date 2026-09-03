import { AdminNav } from "@/components/admin/AdminNav";
import { getAccountContext } from "@/lib/auth/context";
import { requireUser } from "@/lib/auth/requireUser";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireUser();
  const account = await getAccountContext();

  if (!account.isAdmin) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-navy">Admin access required</h1>
        <p className="mt-3 text-sm text-slate-600">
          This area is only available when you sign in with the designated admin email.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-dark">Admin</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-navy">Operations</h1>
      <div className="mt-6">
        <AdminNav />
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}
