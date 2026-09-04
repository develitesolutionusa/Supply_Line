"use client";

import { useState } from "react";
import { AddToCartButton } from "@/components/catalog/AddToCartButton";
import { formatCaseRange } from "@/lib/catalog/display";
import { formatCents, resolveCasePrice, startingCasePrice } from "@/lib/pricing";
import { fieldClass } from "@/lib/ui";
import type { AccountTier, PriceTier, StockStatus } from "@/types/commerce";

export function ProductPurchasePanel({
  productId,
  tiers,
  accountTier,
  stockStatus,
  packSize,
  unitCount,
}: {
  productId: string;
  tiers: PriceTier[];
  accountTier: AccountTier;
  stockStatus: StockStatus;
  packSize: string;
  unitCount: number;
}) {
  const [cases, setCases] = useState(1);
  const unit = resolveCasePrice(tiers, cases, accountTier);
  const standard = startingCasePrice(tiers, "individual");
  const savings = Math.max(0, standard - unit);

  return (
    <div className="rounded-md border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgb(15_23_42_/_0.04)]">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Retail / standard price</p>
      <p className="mt-1 text-sm text-slate-500 line-through">{formatCents(standard)} / case</p>
      <p className="mt-3 text-3xl font-semibold text-navy">{formatCents(unit)}</p>
      <p className="text-sm text-slate-500">
        per case · {accountTier === "business" ? "wholesale" : "retail"} pricing
      </p>
      {savings > 0 ? (
        <p className="mt-2 text-sm font-medium text-emerald-700">You save {formatCents(savings)} per case</p>
      ) : null}
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-slate-500">Pack size</dt>
          <dd className="font-medium text-navy">{packSize}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Min. order</dt>
          <dd className="font-medium text-navy">1 case</dd>
        </div>
        <div>
          <dt className="text-slate-500">Units / case</dt>
          <dd className="font-medium text-navy">{unitCount}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Availability</dt>
          <dd className="font-medium text-navy">{stockStatus.replaceAll("_", " ")}</dd>
        </div>
      </dl>
      <label htmlFor="cases" className="mt-6 block text-sm font-medium text-navy">
        Cases
      </label>
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          aria-label="Decrease cases"
          className={`h-10 w-10 rounded-md border border-slate-200 text-lg text-navy hover:bg-slate-50 ${fieldClass.RING}`}
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
          className={`h-10 w-20 rounded-md border border-slate-200 text-center text-sm ${fieldClass.RING}`}
        />
        <button
          type="button"
          aria-label="Increase cases"
          className={`h-10 w-10 rounded-md border border-slate-200 text-lg text-navy hover:bg-slate-50 ${fieldClass.RING}`}
          onClick={() => setCases((value) => value + 1)}
        >
          +
        </button>
      </div>
      <p className="mt-3 text-sm font-medium text-navy">Line total {formatCents(unit * cases)}</p>
      <div className="mt-5">
        <AddToCartButton productId={productId} cases={cases} stockStatus={stockStatus} className="w-full" />
      </div>
      {accountTier !== "business" ? (
        <p className="mt-3 text-xs text-slate-500">
          Sign in with a business account to unlock volume breaks below.
        </p>
      ) : null}
      <div className="mt-6 overflow-hidden rounded-md border border-slate-200">
        <table className="w-full text-left text-sm">
          <caption className="bg-canvas px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
            Wholesale pricing
          </caption>
          <tbody>
            {tiers.map((tier, index) => {
              const next = tiers[index + 1];
              const inRange = cases >= tier.min_cases && (!next || cases < next.min_cases);
              return (
                <tr key={tier.min_cases} className={inRange ? "bg-sky/5" : ""}>
                  <td className="px-3 py-2 text-slate-600">{formatCaseRange(tiers, index)}</td>
                  <td className="px-3 py-2 text-right font-semibold text-navy">
                    {formatCents(tier.price_per_case_cents)}
                    {accountTier === "individual" && tier.min_cases > 1 ? (
                      <span className="ml-2 text-xs font-normal text-slate-500">business</span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
