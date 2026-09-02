import { QuickOrderForm } from "@/components/quick-order/QuickOrderForm";

export const metadata = {
  title: "Quick order",
};

export default function QuickOrderPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-navy">Quick order</h1>
      <p className="mt-2 text-sm text-slate-600">
        Enter SKUs and case quantities. Unknown or out-of-stock rows are skipped with a reason.
      </p>
      <div className="mt-8">
        <QuickOrderForm />
      </div>
    </div>
  );
}
