"use client";

import { useState } from "react";
import { addToCart } from "@/lib/cart/client";
import { fieldClass } from "@/lib/ui";
import type { StockStatus } from "@/types/commerce";

export function AddToCartButton({
  productId,
  cases = 1,
  stockStatus,
  className = "",
}: {
  productId: string;
  cases?: number;
  stockStatus: StockStatus;
  className?: string;
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const disabled = stockStatus === "out_of_stock" || pending;

  async function onAdd() {
    setPending(true);
    setMessage(null);
    try {
      await addToCart(productId, cases);
      setMessage("Added to cart");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not add");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={onAdd}
        disabled={disabled}
        aria-busy={pending}
        aria-live="polite"
        className={`btn-navy inline-flex h-10 items-center justify-center rounded-md bg-navy px-4 text-sm font-semibold text-white hover:bg-navy-muted disabled:cursor-not-allowed disabled:bg-slate-300 ${fieldClass.RING} ${className}`}
      >
        {stockStatus === "out_of_stock" ? "Out of stock" : pending ? "Adding…" : "Add to cart"}
      </button>
      {message ? (
        <p className="mt-2 text-xs text-slate-600" role="status" aria-live="polite">
          {message}
        </p>
      ) : null}
    </div>
  );
}
