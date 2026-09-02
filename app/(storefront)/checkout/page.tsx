import { CheckoutWizard } from "@/components/checkout/CheckoutWizard";
import { requireUser } from "@/lib/auth/requireUser";

export const metadata = {
  title: "Checkout",
};

export default async function CheckoutPage() {
  await requireUser();

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-semibold tracking-tight text-navy">Checkout</h1>
      <p className="mt-2 text-sm text-slate-600">
        The charged amount is always recalculated on the server from your cart, delivery method, and tax rules.
      </p>
      <div className="mt-8">
        <CheckoutWizard />
      </div>
    </div>
  );
}
