"use client";

import { useState } from "react";
import { AddToCartButton } from "@/components/catalog/AddToCartButton";
import { formatCents, resolveCasePrice } from "@/lib/pricing";
import type { AccountTier, PriceTier, StockStatus } from "@/types/commerce";

export function ProductPurchasePanel({
  productId,
  tiers,
  accountTier,
  stockStatus,
  packSize,
}: {
  productId: string;
  tiers: PriceTier[];
  accountTier: AccountTier;
  stockStatus: StockStatus;
  packSize: string;
}) {
  const [cases, setCases] = useState(1);
  const unit = resolveCasePrice(tiers, cases, accountTier);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{packSize}</p>
      <p className="mt-2 text-3xl font-semibold text-navy">{formatCents(unit)}</p>
      <p className="text-sm text-slate-500">per case · {accountTier} pricing</p>
      <label htmlFor="cases" className="mt-6 block text-sm font-medium text-navy">
        Cases
      </label>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          aria-label="Decrease cases"
          className="h-10 w-10 rounded-lg border border-slate-200 text-lg text-navy hover:bg-slate-50"
          onClick={() => setCases((value) => Math.max(1, value - 1))}
        >
          −
        </button>
        <input
          id="cases"
          type="number"
          min={1}
          value={cases}
          onChange={(event) => setCases(Math.max(1, Number(event.target.value) || 1))}
          className="h-10 w-20 rounded-lg border border-slate-200 text-center text-sm"
        />
        <button
          type="button"
          aria-label="Increase cases"
          className="h-10 w-10 rounded-lg border border-slate-200 text-lg text-navy hover:bg-slate-50"
          onClick={() => setCases((value) => value + 1)}
        >
          +
        </button>
      </div>
      <p className="mt-3 text-sm font-medium text-navy">Line total {formatCents(unit * cases)}</p>
      <div className="mt-5">
        <AddToCartButton productId={productId} cases={cases} stockStatus={stockStatus} className="w-full" />
      </div>
    </div>
  );
}
