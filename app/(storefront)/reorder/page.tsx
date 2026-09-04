import { ReorderView } from "@/components/reorder/ReorderView";

export const metadata = {
  title: "Reorder",
  description: "Repeat a past order with current stock and live case prices.",
};

export default function ReorderPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight text-navy sm:text-3xl">Reorder</h1>
      <p className="mt-2 text-sm text-slate-600">
        Repeat a previous purchase with live stock, current wholesale prices, and editable case quantities.
      </p>
      <div className="mt-8">
        <ReorderView />
      </div>
    </div>
  );
}
