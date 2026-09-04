"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { PanelSkeleton } from "@/components/ui/PageSkeleton";
import { emitCartUpdated } from "@/lib/cart/client";
import { DELIVERY_METHODS, formatCents } from "@/lib/pricing";
import { fieldClass } from "@/lib/ui";
import type { AddressRecord, CartTotals, DeliveryMethod, OrderRecord } from "@/types/commerce";

const STEPS = ["Shipping", "Payment", "Review"];
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;
const STRIPE_APPEARANCE = { theme: "stripe" as const };
const PAYMENT_ELEMENT_OPTIONS = { layout: "tabs" as const };

type Line = {
  id?: string;
  sku?: string;
  name?: string;
  cases: number;
  unit_price_cents?: number;
  line_total_cents?: number;
  unit_price_cents_at_purchase?: number;
  product?: { sku: string; name: string };
};

type CheckoutPayload = {
  cart: { items: Line[]; totals: CartTotals };
  delivery_methods: DeliveryMethod[];
  addresses: AddressRecord[];
  customer: { name: string | null; email: string | null };
  tax_exempt: boolean;
  stripe_configured: boolean;
};

type AddressDraft = {
  label: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
};

const emptyAddress = (): AddressDraft => ({
  label: "Shipping",
  line1: "",
  line2: "",
  city: "",
  state: "",
  zip: "",
});

export function CheckoutWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<CheckoutPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState<AddressDraft>(emptyAddress);
  const [delivery, setDelivery] = useState("standard");
  const [order, setOrder] = useState<OrderRecord | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<"stripe" | "demo" | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadInitial() {
      try {
        const response = await fetch("/api/checkout", { cache: "no-store" });
        if (!response.ok) throw new Error("Could not load checkout");
        const payload = (await response.json()) as CheckoutPayload;
        if (cancelled) return;
        setData(payload);
        setName(payload.customer.name || "");
        setEmail(payload.customer.email || "");
        const preferred = payload.addresses.find((item) => item.is_default) ?? payload.addresses[0];
        if (preferred) {
          setAddress({
            label: preferred.label,
            line1: preferred.line1,
            line2: preferred.line2,
            city: preferred.city,
            state: preferred.state,
            zip: preferred.zip,
          });
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Could not load checkout");
        }
      }
    }
    void loadInitial();
    return () => {
      cancelled = true;
    };
  }, []);

  const checkoutReady = Boolean(data);
  useEffect(() => {
    if (!checkoutReady) return;
    let cancelled = false;
    async function refresh() {
      const params = new URLSearchParams({ delivery, state: address.state });
      const response = await fetch(`/api/checkout?${params.toString()}`, { cache: "no-store" });
      if (!response.ok || cancelled) return;
      const payload = (await response.json()) as CheckoutPayload;
      if (!cancelled) setData(payload);
    }
    void refresh();
    return () => {
      cancelled = true;
    };
  }, [delivery, address.state, checkoutReady]);

  async function createIntent() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/checkout/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delivery_method: delivery, address }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not start payment");
      setOrder(payload.order);
      setClientSecret(payload.client_secret);
      setPaymentMode(payload.payment_mode);
      setStep(1);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Could not start payment");
    } finally {
      setPending(false);
    }
  }

  async function placeDemoOrder() {
    if (!order) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/checkout/confirm-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: order.id }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Payment failed");
      emitCartUpdated();
      router.push(`/checkout/confirmation?order=${payload.order.id}`);
    } catch (payError) {
      setError(payError instanceof Error ? payError.message : "Payment failed");
    } finally {
      setPending(false);
    }
  }

  async function goNext() {
    setError(null);
    if (step === 0) {
      if (!name.trim() || !email.trim()) {
        setError("Name and email are required.");
        return;
      }
      if (!address.line1 || !address.city || !address.state || !address.zip) {
        setError("A complete shipping address is required.");
        return;
      }
      await createIntent();
      return;
    }
    if (step === 1) {
      setStep(2);
      return;
    }
    setStep((value) => Math.min(STEPS.length - 1, value + 1));
  }

  if (!data && !error) {
    return <PanelSkeleton label="Loading checkout" />;
  }

  if (!data) {
    return <p className="text-sm text-rose-700">{error}</p>;
  }

  if (data.cart.items.length === 0 && !order) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <h2 className="text-lg font-semibold text-navy">Your cart is empty</h2>
        <p className="mt-2 text-sm text-slate-600">Add cases before checking out.</p>
        <Link
          href="/catalog"
          className={`${fieldClass.BUTTON} mt-6`}
        >
          Browse catalog
        </Link>
      </div>
    );
  }

  const displayTotals = order
    ? {
        subtotal_cents: order.subtotal_cents,
        shipping_cents: order.shipping_cents,
        tax_cents: order.tax_cents,
        total_cents: order.total_cents,
      }
    : data.cart.totals;
  const lines: Line[] = order?.items ?? data.cart.items;

  const body = (
    <>
      <StepIndicator steps={STEPS} current={step} />

      {step === 0 ? (
        <div className="mt-8 space-y-8">
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-navy">Contact</h2>
            <div>
              <label className={fieldClass.LABEL} htmlFor="checkout-name">
                Contact name
              </label>
              <input
                id="checkout-name"
                className={fieldClass.INPUT}
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
              />
            </div>
            <div>
              <label className={fieldClass.LABEL} htmlFor="checkout-email">
                Email
              </label>
              <input
                id="checkout-email"
                type="email"
                className={fieldClass.INPUT}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
            </div>
            {data.tax_exempt ? (
              <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                This business account is tax-exempt.
              </p>
            ) : null}
          </div>
          <div className="space-y-4">
            <h2 className="text-base font-semibold text-navy">Shipping address</h2>
            {data.addresses.length > 0 ? (
              <fieldset>
                <legend className="text-sm font-medium text-navy">Saved addresses</legend>
                <div className="mt-2 space-y-2">
                  {data.addresses.map((item) => (
                    <label
                      key={item.id}
                      className="flex cursor-pointer gap-3 rounded-md border border-slate-200 p-3 text-sm"
                    >
                      <input
                        type="radio"
                        name="saved-address"
                        onChange={() =>
                          setAddress({
                            label: item.label,
                            line1: item.line1,
                            line2: item.line2,
                            city: item.city,
                            state: item.state,
                            zip: item.zip,
                          })
                        }
                      />
                      <span>
                        <span className="font-medium text-navy">{item.label}</span>
                        <span className="mt-1 block text-slate-600">
                          {item.line1}, {item.city}, {item.state} {item.zip}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}
            <AddressFields address={address} onChange={setAddress} />
          </div>
          <fieldset className="space-y-3">
            <legend className="text-base font-semibold text-navy">Delivery method</legend>
            {(data.delivery_methods.length ? data.delivery_methods : DELIVERY_METHODS).map((method) => (
              <label key={method.id} className="flex cursor-pointer gap-3 rounded-md border border-slate-200 p-4">
                <input
                  type="radio"
                  name="delivery"
                  checked={delivery === method.id}
                  onChange={() => setDelivery(method.id)}
                />
                <span>
                  <span className="block font-medium text-navy">{method.label}</span>
                  <span className="mt-1 block text-sm text-slate-600">{method.description}</span>
                </span>
              </label>
            ))}
          </fieldset>
        </div>
      ) : null}

      {step === 1 && paymentMode === "stripe" && clientSecret && order ? (
        <div className="mt-8 space-y-6">
          <CheckoutReview
            name={name}
            email={email}
            address={address}
            delivery={delivery}
            lines={lines}
          />
          <StripePaymentForm
            clientSecret={clientSecret}
            orderId={order.id}
            onError={setError}
            onBack={() => setStep(0)}
          />
        </div>
      ) : null}

      {step === 1 && paymentMode !== "stripe" ? (
        <div className="mt-8 rounded-md border border-slate-200 bg-canvas p-4 text-sm text-slate-700">
          <p className="font-medium text-navy">Payment</p>
          <p className="mt-2">
            Stripe keys are not configured, so a card form is not shown. Continue to review and place a
            demo order, or add Stripe test keys to embed the Payment Element.
          </p>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mt-8">
          <CheckoutReview
            name={name}
            email={email}
            address={address}
            delivery={delivery}
            lines={lines}
          />
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 text-sm text-rose-700" role="alert">
          {error}
        </p>
      ) : null}

      {step === 1 && paymentMode === "stripe" ? null : (
        <div className="mt-8 flex flex-wrap gap-3">
          {step > 0 ? (
            <button
              type="button"
              className={fieldClass.GHOST}
              onClick={() => setStep((value) => value - 1)}
            >
              Back
            </button>
          ) : null}
          {step < 2 ? (
            <button
              type="button"
              disabled={pending}
              className={fieldClass.BUTTON}
              onClick={() => void goNext()}
            >
              {pending ? "Working…" : step === 0 ? "Continue to payment" : "Continue to review"}
            </button>
          ) : (
            <button
              type="button"
              disabled={pending}
              className={fieldClass.BUTTON}
              onClick={() => void placeDemoOrder()}
            >
              {pending ? "Placing order…" : "Place order"}
            </button>
          )}
        </div>
      )}
    </>
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
      <div className="rounded-md border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgb(15_23_42_/_0.04)]">{body}</div>
      <aside className="h-fit rounded-md border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgb(15_23_42_/_0.04)]">
        <h2 className="text-lg font-semibold text-navy">Order total</h2>
        <p className="mt-1 text-xs text-slate-500">Calculated on the server from live cart prices.</p>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatCents(displayTotals.subtotal_cents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Shipping</dt>
            <dd>{formatCents(displayTotals.shipping_cents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Tax</dt>
            <dd>{formatCents(displayTotals.tax_cents)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold text-navy">
            <dt>Total</dt>
            <dd>{formatCents(displayTotals.total_cents)}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}

function AddressFields({
  address,
  onChange,
}: {
  address: AddressDraft;
  onChange: (next: AddressDraft) => void;
}) {
  function update(key: keyof AddressDraft, value: string) {
    onChange({ ...address, [key]: value });
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className={fieldClass.LABEL} htmlFor="addr-line1">
          Address
        </label>
        <input
          id="addr-line1"
          className={fieldClass.INPUT}
          value={address.line1}
          onChange={(event) => update("line1", event.target.value)}
          autoComplete="address-line1"
        />
      </div>
      <div className="sm:col-span-2">
        <label className={fieldClass.LABEL} htmlFor="addr-line2">
          Apt / suite
        </label>
        <input
          id="addr-line2"
          className={fieldClass.INPUT}
          value={address.line2}
          onChange={(event) => update("line2", event.target.value)}
          autoComplete="address-line2"
        />
      </div>
      <div>
        <label className={fieldClass.LABEL} htmlFor="addr-city">
          City
        </label>
        <input
          id="addr-city"
          className={fieldClass.INPUT}
          value={address.city}
          onChange={(event) => update("city", event.target.value)}
          autoComplete="address-level2"
        />
      </div>
      <div>
        <label className={fieldClass.LABEL} htmlFor="addr-state">
          State
        </label>
        <input
          id="addr-state"
          className={fieldClass.INPUT}
          maxLength={2}
          value={address.state}
          onChange={(event) => update("state", event.target.value.toUpperCase())}
          autoComplete="address-level1"
        />
      </div>
      <div>
        <label className={fieldClass.LABEL} htmlFor="addr-zip">
          ZIP
        </label>
        <input
          id="addr-zip"
          className={fieldClass.INPUT}
          value={address.zip}
          onChange={(event) => update("zip", event.target.value)}
          autoComplete="postal-code"
        />
      </div>
    </div>
  );
}

function CheckoutReview({
  name,
  email,
  address,
  delivery,
  lines,
}: {
  name: string;
  email: string;
  address: AddressDraft;
  delivery: string;
  lines: Line[];
}) {
  return (
    <div className="space-y-4 text-sm">
      <p>
        <span className="font-medium text-navy">{name}</span> · {email}
      </p>
      <p className="text-slate-600">
        {address.line1}, {address.city}, {address.state} {address.zip}
      </p>
      <p className="text-slate-600">
        Delivery: {DELIVERY_METHODS.find((item) => item.id === delivery)?.label ?? delivery}
      </p>
      <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
        {lines.map((item, index) => {
          const label = item.name ?? item.product?.name ?? item.sku ?? `Item ${index + 1}`;
          const total =
            item.unit_price_cents_at_purchase != null
              ? item.unit_price_cents_at_purchase * item.cases
              : (item.line_total_cents ?? 0);
          return (
            <li key={item.id ?? item.sku ?? index} className="flex justify-between px-4 py-3">
              <span>
                {label} × {item.cases}
              </span>
              <span>{formatCents(total)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function StripePaymentForm({
  clientSecret,
  orderId,
  onError,
  onBack,
}: {
  clientSecret: string;
  orderId: string;
  onError: (message: string | null) => void;
  onBack: () => void;
}) {
  const options = useMemo(
    () => ({ clientSecret, appearance: STRIPE_APPEARANCE }),
    [clientSecret],
  );

  if (!stripePromise) {
    return <p className="text-sm text-rose-700">Stripe is not configured.</p>;
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <StripePaymentFields orderId={orderId} onError={onError} onBack={onBack} />
    </Elements>
  );
}

function StripePaymentFields({
  orderId,
  onError,
  onBack,
}: {
  orderId: string;
  onError: (message: string | null) => void;
  onBack: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements || !ready) {
      onError("Payment form is still loading. Please wait a moment and try again.");
      return;
    }

    setPending(true);
    onError(null);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/confirmation?order=${orderId}`,
      },
      redirect: "if_required",
    });

    if (result.error) {
      onError(result.error.message ?? "Your card was declined.");
      setPending(false);
      return;
    }

    window.location.href = `/checkout/confirmation?order=${orderId}`;
  }

  return (
    <form className="space-y-6" onSubmit={(event) => void onSubmit(event)}>
      <div>
        <p className="mb-3 text-sm font-medium text-navy">Payment method</p>
        <PaymentElement options={PAYMENT_ELEMENT_OPTIONS} onReady={() => setReady(true)} />
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className={fieldClass.GHOST}
          onClick={onBack}
        >
          Back
        </button>
        <button
          type="submit"
          disabled={pending || !stripe || !ready}
          className={fieldClass.BUTTON}
        >
          {pending ? "Processing…" : ready ? "Place order" : "Loading payment…"}
        </button>
      </div>
    </form>
  );
}
