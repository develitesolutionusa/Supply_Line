import type { PriceTier } from "@/types/commerce";

export function formatCaseRange(tiers: PriceTier[], index: number) {
  const min = tiers[index]?.min_cases ?? 1;
  const next = tiers[index + 1]?.min_cases;
  if (!next) return `${min}+ cases`;
  if (next - 1 <= min) return `${min} case${min === 1 ? "" : "s"}`;
  return `${min}–${next - 1} cases`;
}

export function shortOrderId(id: string) {
  return `SO-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}
