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
    <div className="flex min-h-[calc(100dvh-4rem)]">
      <aside className="hidden w-56 shrink-0 bg-navy lg:block">
        <p className="px-6 pb-2 pt-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-on-navy">
          Operations
        </p>
        <AdminNav />
      </aside>
      <div className="min-w-0 flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <div className="lg:hidden">
          <AdminNav variant="mobile" />
        </div>
        <div className="mt-6 lg:mt-0">{children}</div>
      </div>
    </div>
  );
}
