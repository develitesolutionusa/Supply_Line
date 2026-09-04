"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductMedia } from "@/components/catalog/ProductMedia";
import { PanelSkeleton } from "@/components/ui/PageSkeleton";
import { deleteCartItem, fetchCart, patchCartItem, type CartResponse } from "@/lib/cart/client";
import { formatCents } from "@/lib/pricing";
import { fieldClass } from "@/lib/ui";

export function CartView() {
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [signedOut, setSignedOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const next = await fetchCart();
        if (cancelled) return;
        if (!next) {
          setSignedOut(true);
          setCart(null);
          return;
        }
        setSignedOut(false);
        setCart(next);
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Could not load cart");
      }
    }
    void load();
    const onUpdate = () => void load();
    window.addEventListener("cart-updated", onUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener("cart-updated", onUpdate);
    };
  }, []);

  async function changeQty(id: string, cases: number, previous: number) {
    if (!cart) return;
    const optimistic = {
      ...cart,
      items: cart.items.map((item) =>
        item.id === id
          ? {
              ...item,
              cases,
              line_total_cents: item.unit_price_cents * cases,
            }
          : item,
      ),
    };
    setCart(optimistic);
    try {
      const next = await patchCartItem(id, cases);
      setCart(next);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Update failed");
      await patchCartItem(id, previous).catch(() => undefined);
      const rolled = await fetchCart();
      if (rolled) setCart(rolled);
    }
  }

  if (signedOut) {
    return (
      <EmptyState
        title="Sign in to view your cart"
        body="Carts are stored per account so they follow you across devices."
        href="/sign-in?redirect_url=/cart"
        cta="Sign in"
      />
    );
  }

  if (!cart) {
    return <PanelSkeleton label="Loading cart" />;
  }

  if (cart.items.length === 0) {
    return (
      <EmptyState
        title="Your cart is empty"
        body="Add cases from the catalog. Prices will be recalculated on the server."
        href="/catalog"
        cta="Browse catalog"
      />
    );
  }

  const { totals } = cart;

  return (
    <div className="grid gap-8 pb-24 lg:grid-cols-[1fr_20rem] lg:pb-0">
      <ul className="space-y-4">
        {cart.items.map((item) => (
          <li key={item.id} className="rounded-md border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgb(15_23_42_/_0.04)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex gap-3">
                <div className="w-20 shrink-0">
                  <ProductMedia name={item.product.name} sku={item.product.sku} imageUrl={item.product.image_url} />
                </div>
                <div>
                <Link
                  href={`/products/${item.product.sku}`}
                  className={`font-semibold text-navy hover:underline ${fieldClass.RING}`}
                >
                  {item.product.name}
                </Link>
                <p className="font-mono text-xs text-slate-500">SKU: {item.product.sku}</p>
                <p className="mt-1 text-xs text-slate-500">{item.product.pack_size}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {formatCents(item.unit_price_cents)} / case
                </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <QtyInput
                  id={item.id}
                  name={item.product.name}
                  cases={item.cases}
                  onCommit={(next, previous) => void changeQty(item.id, next, previous)}
                />
                <p className="w-24 text-right text-sm font-semibold text-navy">
                  {formatCents(item.line_total_cents)}
                </p>
                <button
                  type="button"
                  className={`text-sm text-rose-700 hover:underline ${fieldClass.RING}`}
                  aria-label={`Remove ${item.product.name} from cart`}
                  onClick={() => void deleteCartItem(item.id).then(setCart)}
                >
                  Remove
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <aside className="h-fit rounded-md border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgb(15_23_42_/_0.04)]">
        <h2 className="text-lg font-semibold text-navy">Order summary</h2>
        {totals.remaining_for_free_shipping_cents > 0 ? (
          <p className="mt-3 rounded-lg bg-sky/10 px-3 py-2 text-xs text-navy">
            Add {formatCents(totals.remaining_for_free_shipping_cents)} more for free standard shipping.
          </p>
        ) : (
          <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            You have unlocked free standard shipping.
          </p>
        )}
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatCents(totals.subtotal_cents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Shipping estimate</dt>
            <dd>{formatCents(totals.shipping_cents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Tax</dt>
            <dd>{formatCents(totals.tax_cents)}</dd>
          </div>
          <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold text-navy">
            <dt>Total</dt>
            <dd>{formatCents(totals.total_cents)}</dd>
          </div>
        </dl>
        {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
        <Link
          href="/checkout"
          className={`${fieldClass.BUTTON} mt-6 w-full`}
        >
          Checkout
        </Link>
        <Link href="/catalog" className={`${fieldClass.GHOST} mt-3 w-full`}>
          Continue shopping
        </Link>
      </aside>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white p-3 lg:hidden">
        <Link href="/checkout" className={`${fieldClass.BUTTON} w-full`}>
          Checkout · {formatCents(totals.total_cents)}
        </Link>
      </div>
    </div>
  );
}

function QtyInput({
  id,
  name,
  cases,
  onCommit,
}: {
  id: string;
  name: string;
  cases: number;
  onCommit: (next: number, previous: number) => void;
}) {
  const [value, setValue] = useState(cases);
  useEffect(() => {
    setValue(cases);
  }, [cases]);

  return (
    <>
      <label className="sr-only" htmlFor={`qty-${id}`}>
        Cases for {name}
      </label>
      <input
        id={`qty-${id}`}
        type="number"
        min={1}
        value={value}
        className="h-10 w-20 rounded-lg border border-slate-200 px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky"
        onChange={(event) => setValue(Math.max(1, Number(event.target.value) || 1))}
        onBlur={() => {
          if (value !== cases) onCommit(value, cases);
        }}
      />
    </>
  );
}

function EmptyState({
  title,
  body,
  href,
  cta,
}: {
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <h2 className="text-lg font-semibold text-navy">{title}</h2>
      <p className="mt-2 text-sm text-slate-600">{body}</p>
      <Link
        href={href}
        className={fieldClass.BUTTON}
      >
        {cta}
      </Link>
    </div>
  );
}
