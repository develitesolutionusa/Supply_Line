import type { AccountTier, CartTotals, DeliveryMethod, PriceTier, StockStatus } from "@/types/commerce";

export const FREE_SHIPPING_THRESHOLD_CENTS = 25_000;
export const FLAT_SHIPPING_CENTS = 1_499;

export const TAX_RULES: Record<string, number> = {
  CA: 7.25,
  NY: 8,
  TX: 6.25,
  FL: 6,
  WA: 6.5,
  IL: 6.25,
  PA: 6,
};

export const DELIVERY_METHODS: DeliveryMethod[] = [
  {
    id: "pickup",
    label: "Warehouse pickup",
    description: "Pick up at the local warehouse during business hours.",
    shipping_cents: 0,
  },
  {
    id: "local",
    label: "Local delivery",
    description: "Same-metro delivery window, typically next business day.",
    shipping_cents: 1_200,
  },
  {
    id: "standard",
    label: "Standard shipping",
    description: "Ground freight. Free over the configured order threshold.",
    shipping_cents: null,
  },
  {
    id: "expedited",
    label: "Expedited",
    description: "Two-day freight when inventory is available.",
    shipping_cents: 3_999,
  },
];

export function resolveCasePrice(
  tiers: PriceTier[],
  cases: number,
  accountTier: AccountTier,
): number {
  if (tiers.length === 0 || cases < 1) return 0;

  const sorted = [...tiers].sort((a, b) => a.min_cases - b.min_cases);

  if (accountTier === "individual") {
    return sorted[0]?.price_per_case_cents ?? 0;
  }

  let price = sorted[0]?.price_per_case_cents ?? 0;
  for (const tier of sorted) {
    if (cases >= tier.min_cases) {
      price = tier.price_per_case_cents;
    }
  }
  return price;
}

export function startingCasePrice(tiers: PriceTier[], accountTier: AccountTier): number {
  return resolveCasePrice(tiers, 1, accountTier);
}

export function deriveStockStatus(quantityOnHand: number, lowStockThreshold: number): StockStatus {
  if (quantityOnHand <= 0) return "out_of_stock";
  if (quantityOnHand <= lowStockThreshold) return "low_stock";
  return "in_stock";
}

export function taxRateForState(stateCode: string | undefined, taxExempt: boolean): number {
  if (taxExempt || !stateCode) return 0;
  return TAX_RULES[stateCode.toUpperCase()] ?? 0;
}

export function shippingCentsForMethod(
  methodId: string,
  subtotalCents: number,
): number {
  const method = DELIVERY_METHODS.find((item) => item.id === methodId) ?? DELIVERY_METHODS[2];
  if (method.shipping_cents !== null) {
    return method.shipping_cents;
  }
  return subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_CENTS;
}

export function calculateCartTotals(options: {
  lineSubtotalsCents: number[];
  deliveryMethodId: string;
  shippingState?: string;
  taxExempt: boolean;
}): CartTotals {
  const subtotal_cents = options.lineSubtotalsCents.reduce((sum, value) => sum + value, 0);
  const shipping_cents = shippingCentsForMethod(options.deliveryMethodId, subtotal_cents);
  const rate = taxRateForState(options.shippingState, options.taxExempt);
  const tax_cents = Math.round((subtotal_cents * rate) / 100);
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD_CENTS - subtotal_cents);

  return {
    subtotal_cents,
    shipping_cents,
    tax_cents,
    total_cents: subtotal_cents + shipping_cents + tax_cents,
    free_shipping_threshold_cents: FREE_SHIPPING_THRESHOLD_CENTS,
    remaining_for_free_shipping_cents: remaining,
  };
}

export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
