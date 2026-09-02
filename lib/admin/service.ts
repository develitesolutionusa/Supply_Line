import { randomUUID } from "node:crypto";
import { catalogTables, ensureCatalog, hydrateProduct } from "@/lib/catalog/query";
import { deriveStockStatus } from "@/lib/pricing";
import { mutateStore, readStoreLocked } from "@/lib/store/file-store";
import type { OrderStatus, PriceTier, Product } from "@/types/commerce";

const SALES_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export async function adminMetrics() {
  const store = await readStoreLocked();
  const since = Date.now() - SALES_WINDOW_MS;
  const paid = store.orders.filter(
    (order) =>
      (order.status === "paid" || order.status === "fulfilled") &&
      new Date(order.created_at).getTime() >= since,
  );
  const sales_cents = paid.reduce((sum, order) => sum + order.total_cents, 0);
  const pending = store.orders.filter((order) => order.status === "pending").length;
  const avg_order_value_cents = paid.length ? Math.round(sales_cents / paid.length) : 0;
  const new_accounts = Object.keys(store.businessAccounts).length;

  return {
    sales_cents,
    pending_orders: pending,
    avg_order_value_cents,
    new_accounts,
    window_days: 30,
  };
}

export async function lowStockProducts() {
  const { products, inventory, categories } = await catalogTables();
  const items = [];
  for (const product of products) {
    const hydrated = await hydrateProduct(product, "business", inventory, categories);
    if (hydrated.stock_status !== "in_stock") {
      items.push(hydrated);
    }
  }
  return items.sort((a, b) => a.quantity_on_hand - b.quantity_on_hand);
}

export async function topProducts(limit = 8) {
  const store = await readStoreLocked();
  const counts = new Map<string, { product_id: string; sku: string; name: string; cases: number }>();
  for (const order of store.orders) {
    if (order.status !== "paid" && order.status !== "fulfilled") continue;
    for (const item of order.items) {
      const current = counts.get(item.product_id) ?? {
        product_id: item.product_id,
        sku: item.sku,
        name: item.name,
        cases: 0,
      };
      current.cases += item.cases;
      counts.set(item.product_id, current);
    }
  }
  return [...counts.values()].sort((a, b) => b.cases - a.cases).slice(0, limit);
}

export async function upsertProduct(input: Partial<Product> & { id?: string }) {
  return mutateStore((store) => {
    ensureCatalog(store);
    if (input.id) {
      const existing = store.products.find((item) => item.id === input.id);
      if (!existing) throw new Error("Product not found");
      Object.assign(existing, {
        sku: input.sku ?? existing.sku,
        name: input.name ?? existing.name,
        category_id: input.category_id ?? existing.category_id,
        description: input.description ?? existing.description,
        image_url: input.image_url === undefined ? existing.image_url : input.image_url,
        pack_size: input.pack_size ?? existing.pack_size,
        unit_count: input.unit_count ?? existing.unit_count,
        is_active: input.is_active ?? existing.is_active,
        price_tiers: input.price_tiers ?? existing.price_tiers,
        low_stock_threshold: input.low_stock_threshold ?? existing.low_stock_threshold,
      });
      return existing;
    }

    const sku = input.sku?.trim();
    if (!sku || !input.name || !input.category_id) {
      throw new Error("sku, name, and category_id are required");
    }
    if (store.products.some((item) => item.sku.toLowerCase() === sku.toLowerCase())) {
      throw new Error("SKU already exists");
    }
    const product: Product = {
      id: `prd_${randomUUID().slice(0, 8)}`,
      sku,
      name: input.name,
      category_id: input.category_id,
      description: input.description ?? "",
      image_url: input.image_url ?? null,
      pack_size: input.pack_size ?? "1 case",
      unit_count: input.unit_count ?? 1,
      is_active: input.is_active ?? true,
      price_tiers: input.price_tiers ?? [{ min_cases: 1, price_per_case_cents: 0 }],
      quantity_on_hand: input.quantity_on_hand ?? 0,
      low_stock_threshold: input.low_stock_threshold ?? 5,
    };
    store.products.push(product);
    store.inventory[product.id] = product.quantity_on_hand;
    return product;
  });
}

export async function archiveProduct(id: string) {
  return mutateStore((store) => {
    ensureCatalog(store);
    const product = store.products.find((item) => item.id === id);
    if (!product) throw new Error("Product not found");
    product.is_active = false;
    return product;
  });
}

export async function setProductImage(id: string, imageUrl: string) {
  return mutateStore((store) => {
    ensureCatalog(store);
    const product = store.products.find((item) => item.id === id);
    if (!product) throw new Error("Product not found");
    product.image_url = imageUrl;
    return product;
  });
}

export async function adjustInventory(productId: string, quantityOnHand: number) {
  if (!Number.isInteger(quantityOnHand) || quantityOnHand < 0) {
    throw new Error("quantity_on_hand must be a non-negative integer");
  }
  return mutateStore((store) => {
    ensureCatalog(store);
    const product = store.products.find((item) => item.id === productId);
    if (!product) throw new Error("Product not found");
    store.inventory[productId] = quantityOnHand;
    product.quantity_on_hand = quantityOnHand;
    return {
      product_id: productId,
      quantity_on_hand: quantityOnHand,
      stock_status: deriveStockStatus(quantityOnHand, product.low_stock_threshold),
    };
  });
}

export async function listBusinessAccounts() {
  const store = await readStoreLocked();
  const fromStore = Object.entries(store.businessAccounts).map(([id, account]) => ({
    id,
    ...account,
  }));
  const fromOrders = store.orders
    .filter((order) => order.org_id)
    .map((order) => order.org_id as string);
  for (const orgId of fromOrders) {
    if (!fromStore.some((account) => account.id === orgId)) {
      fromStore.push({
        id: orgId,
        tax_exempt: false,
        company_name: orgId,
        stripe_customer_id: null,
        created_at: new Date().toISOString(),
      });
    }
  }
  return fromStore;
}

export async function setTaxExempt(orgId: string, taxExempt: boolean, companyName?: string) {
  return mutateStore((store) => {
    const current = store.businessAccounts[orgId] ?? {
      tax_exempt: false,
      company_name: companyName ?? orgId,
      stripe_customer_id: null,
      created_at: new Date().toISOString(),
    };
    current.tax_exempt = taxExempt;
    if (companyName) current.company_name = companyName;
    store.businessAccounts[orgId] = current;
    return { id: orgId, ...current };
  });
}

export type { PriceTier, OrderStatus };
