import { ReorderView } from "@/components/reorder/ReorderView";

export const metadata = {
  title: "Reorder",
};

export default function ReorderPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-navy">Reorder</h1>
      <p className="mt-2 text-sm text-slate-600">
        Past orders are re-priced against current tiers and stock before anything is added to the cart.
      </p>
      <div className="mt-8">
        <ReorderView />
      </div>
    </div>
  );
}
