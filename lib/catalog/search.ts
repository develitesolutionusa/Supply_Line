export { pageBounds } from "@/lib/pagination";

export function productSearchFilter(raw: string) {
  const q = raw.trim().replace(/[%_,()]/g, "");
  if (!q) return null;
  return `name.ilike.%${q}%,sku.ilike.${q}%`;
}