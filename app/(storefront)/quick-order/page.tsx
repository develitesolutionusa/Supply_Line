import { QuickOrderForm } from "@/components/quick-order/QuickOrderForm";

export const metadata = {
  title: "Quick order",
  description: "Add multiple SKUs and case quantities to your cart in one sheet.",
};

export default function QuickOrderPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight text-navy sm:text-3xl">Quick order</h1>
      <p className="mt-2 text-sm text-slate-600">
        Built for restaurant purchasers — enter SKUs and case quantities, then add everything in one pass.
      </p>
      <div className="mt-8">
        <QuickOrderForm />
      </div>
    </div>
  );
}
