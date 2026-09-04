import { CartView } from "@/components/cart/CartView";

export const metadata = {
  title: "Cart",
  description: "Review case quantities. Line prices are recalculated from current tiers on every read.",
};

export default function CartPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight text-navy sm:text-3xl">Cart</h1>
      <p className="mt-2 text-sm text-slate-600">
        Pack size, wholesale case price, and tax are recalculated from live inventory on every read.
      </p>
      <div className="mt-8">
        <CartView />
      </div>
    </div>
  );
}
