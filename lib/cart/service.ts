import { randomUUID } from "node:crypto";
import { getProductById, getProductBySku } from "@/lib/catalog/query";
import { calculateCartTotals, resolveCasePrice } from "@/lib/pricing";
import { mutateStore, readStoreLocked } from "@/lib/store/file-store";
import type { AccountTier, CartItemRecord } from "@/types/commerce";

export async function getCartSnapshot(options: {
  userId: string;
  accountTier: AccountTier;
  taxExempt: boolean;
  deliveryMethodId?: string;
  shippingState?: string;
}) {
  const store = await readStoreLocked();
  const items = store.carts[options.userId] ?? [];
  const deliveryMethodId = options.deliveryMethodId ?? "standard";

  const resolved = [];
  for (const item of items) {
    const product = await getProductById(item.product_id, options.accountTier);
    if (!product) continue;
    const unit_price_cents = resolveCasePrice(product.price_tiers, item.cases, options.accountTier);
    resolved.push({
      id: item.id,
      cases: item.cases,
      unit_price_cents,
      line_total_cents: unit_price_cents * item.cases,
      product,
    });
  }

  const totals = calculateCartTotals({
    lineSubtotalsCents: resolved.map((item) => item.line_total_cents),
    deliveryMethodId,
    shippingState: options.shippingState,
    taxExempt: options.taxExempt,
  });

  return {
    items: resolved,
    item_count: resolved.reduce((sum, item) => sum + item.cases, 0),
    totals,
    delivery_method_id: deliveryMethodId,
  };
}

export async function upsertCartItem(userId: string, productId: string, cases: number) {
  if (!Number.isInteger(cases) || cases < 1) {
    throw new Error("Cases must be a positive integer.");
  }

  return mutateStore((store) => {
    const current = store.carts[userId] ?? [];
    const existing = current.find((item) => item.product_id === productId);
    if (existing) {
      existing.cases = cases;
    } else {
      const next: CartItemRecord = { id: randomUUID(), product_id: productId, cases };
      current.push(next);
    }
    store.carts[userId] = current;
    return store.carts[userId];
  });
}

export async function addCasesToCart(userId: string, productId: string, cases: number) {
  const store = await readStoreLocked();
  const existing = (store.carts[userId] ?? []).find((item) => item.product_id === productId);
  const nextCases = (existing?.cases ?? 0) + cases;
  return upsertCartItem(userId, productId, nextCases);
}

export async function updateCartItem(userId: string, itemId: string, cases: number) {
  if (!Number.isInteger(cases) || cases < 1) {
    throw new Error("Cases must be a positive integer.");
  }

  return mutateStore((store) => {
    const current = store.carts[userId] ?? [];
    const item = current.find((entry) => entry.id === itemId);
    if (!item) throw new Error("Cart item not found.");
    item.cases = cases;
    store.carts[userId] = current;
    return item;
  });
}

export async function removeCartItem(userId: string, itemId: string) {
  return mutateStore((store) => {
    store.carts[userId] = (store.carts[userId] ?? []).filter((item) => item.id !== itemId);
  });
}

export async function clearCart(userId: string) {
  return mutateStore((store) => {
    store.carts[userId] = [];
  });
}

export async function bulkAddBySku(
  userId: string,
  accountTier: AccountTier,
  rows: { sku: string; qty: number }[],
) {
  const results: { sku: string; qty: number; ok: boolean; reason?: string }[] = [];

  for (const row of rows) {
    const sku = row.sku.trim();
    const qty = row.qty;
    if (!sku) {
      results.push({ sku, qty, ok: false, reason: "Blank SKU" });
      continue;
    }
    if (!Number.isInteger(qty) || qty < 1) {
      results.push({ sku, qty, ok: false, reason: "Quantity must be a positive integer" });
      continue;
    }
    const product = await getProductBySku(sku, accountTier);
    if (!product) {
      results.push({ sku, qty, ok: false, reason: "Unknown SKU" });
      continue;
    }
    if (product.stock_status === "out_of_stock") {
      results.push({ sku, qty, ok: false, reason: "Out of stock" });
      continue;
    }
    await addCasesToCart(userId, product.id, qty);
    results.push({ sku, qty, ok: true });
  }

  return results;
}
