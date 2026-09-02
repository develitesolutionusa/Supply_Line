import { CartView } from "@/components/cart/CartView";

export const metadata = {
  title: "Cart",
};

export default function CartPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-navy">Your cart</h1>
      <p className="mt-2 text-sm text-slate-600">
        Line prices are recalculated on every read from current tiers and your account type.
      </p>
      <div className="mt-8">
        <CartView />
      </div>
    </div>
  );
}
