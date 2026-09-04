import { randomUUID } from "node:crypto";
import { catalogTables, hydrateProduct } from "@/lib/catalog/query";
import { notifyIfLowStockBreached } from "@/lib/inventory/alerts";
import {
  ADMIN_METRICS_WINDOW_MS,
  summarizeAdminMetrics,
  type AdminMetricsRow,
} from "@/lib/admin/metrics";
import { deriveStockStatus } from "@/lib/pricing";
import { assertNoError, createServiceClient, DEFAULT_WAREHOUSE_ID } from "@/lib/supabase/server";
import type { OrderStatus, PriceTier, Product } from "@/types/commerce";

function asMetricsRow(value: unknown): AdminMetricsRow | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (
    row.sales_cents == null ||
    row.paid_orders == null ||
    row.pending_orders == null ||
    row.new_accounts == null
  ) {
    return null;
  }
  return {
    sales_cents: Number(row.sales_cents),
    paid_orders: Number(row.paid_orders),
    pending_orders: Number(row.pending_orders),
    new_accounts: Number(row.new_accounts),
  };
}

export async function adminMetrics() {
  const supabase = createServiceClient();
  const since = new Date(Date.now() - ADMIN_METRICS_WINDOW_MS).toISOString();
  const { data, error } = await supabase.rpc("admin_dashboard_metrics", { p_since: since });
  const aggregated = !error ? asMetricsRow(data) : null;
  if (aggregated) {
    return summarizeAdminMetrics(aggregated, since);
  }

  const [
    { data: paid, error: paidError },
    { count: pendingCount, error: pendingError },
    { count: newAccountCount, error: accountError },
  ] = await Promise.all([
    supabase
      .from("orders")
      .select("total_cents")
      .in("status", ["paid", "fulfilled"])
      .gte("created_at", since),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("business_accounts")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),
  ]);
  assertNoError(paidError, "Could not load sales");
  assertNoError(pendingError, "Could not load pending orders");
  assertNoError(accountError, "Could not load accounts");

  const sales_cents = (paid ?? []).reduce((sum, order) => sum + (order.total_cents as number), 0);
  return summarizeAdminMetrics(
    {
      sales_cents,
      paid_orders: paid?.length ?? 0,
      pending_orders: pendingCount ?? 0,
      new_accounts: newAccountCount ?? 0,
    },
    since,
  );
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
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("order_items")
    .select("product_id, cases, orders!inner(status), products(sku, name)");
  assertNoError(error, "Could not load top products");

  const counts = new Map<string, { product_id: string; sku: string; name: string; cases: number }>();
  for (const row of data ?? []) {
    const order = Array.isArray(row.orders) ? row.orders[0] : row.orders;
    if (order?.status !== "paid" && order?.status !== "fulfilled") continue;
    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    const current = counts.get(row.product_id) ?? {
      product_id: row.product_id,
      sku: product?.sku ?? "",
      name: product?.name ?? "",
      cases: 0,
    };
    current.cases += row.cases as number;
    counts.set(row.product_id, current);
  }
  return [...counts.values()].sort((a, b) => b.cases - a.cases).slice(0, limit);
}

async function replacePriceTiers(productId: string, tiers: PriceTier[]) {
  const supabase = createServiceClient();
  const { error: deleteError } = await supabase.from("price_tiers").delete().eq("product_id", productId);
  assertNoError(deleteError, "Could not reset price tiers");
  if (tiers.length === 0) return;
  const { error } = await supabase.from("price_tiers").insert(
    tiers.map((tier) => ({
      product_id: productId,
      min_cases: tier.min_cases,
      price_per_case_cents: tier.price_per_case_cents,
    })),
  );
  assertNoError(error, "Could not save price tiers");
}

export async function upsertProduct(input: Partial<Product> & { id?: string }) {
  const supabase = createServiceClient();
  if (input.id) {
    const { data: existing, error } = await supabase.from("products").select("*").eq("id", input.id).maybeSingle();
    assertNoError(error, "Product not found");
    if (!existing) throw new Error("Product not found");

    const { data, error: updateError } = await supabase
      .from("products")
      .update({
        sku: input.sku ?? existing.sku,
        name: input.name ?? existing.name,
        category_id: input.category_id ?? existing.category_id,
        description: input.description ?? existing.description,
        image_url: input.image_url === undefined ? existing.image_url : input.image_url,
        pack_size: input.pack_size ?? existing.pack_size,
        unit_count: input.unit_count ?? existing.unit_count,
        is_active: input.is_active ?? existing.is_active,
      })
      .eq("id", input.id)
      .select("*")
      .single();
    assertNoError(updateError, "Could not update product");
    if (input.price_tiers) await replacePriceTiers(input.id, input.price_tiers);
    if (typeof input.low_stock_threshold === "number") {
      await supabase.from("inventory").update({ low_stock_threshold: input.low_stock_threshold }).eq("product_id", input.id);
    }
    const { products } = await catalogTables();
    const product = products.find((item) => item.id === input.id);
    if (!product) throw new Error("Product not found");
    return product;
  }

  const sku = input.sku?.trim();
  if (!sku || !input.name || !input.category_id) {
    throw new Error("sku, name, and category_id are required");
  }

  const id = randomUUID();
  const { error: insertError } = await supabase.from("products").insert({
    id,
    sku,
    name: input.name,
    category_id: input.category_id,
    description: input.description ?? "",
    image_url: input.image_url ?? null,
    pack_size: input.pack_size ?? "1 case",
    unit_count: input.unit_count ?? 1,
    is_active: input.is_active ?? true,
  });
  assertNoError(insertError, "Could not create product");
  await replacePriceTiers(id, input.price_tiers ?? [{ min_cases: 1, price_per_case_cents: 0 }]);
  const { error: inventoryError } = await supabase.from("inventory").insert({
    product_id: id,
    warehouse_id: DEFAULT_WAREHOUSE_ID,
    quantity_on_hand: input.quantity_on_hand ?? 0,
    low_stock_threshold: input.low_stock_threshold ?? 5,
  });
  assertNoError(inventoryError, "Could not create inventory");
  const { products } = await catalogTables();
  const product = products.find((item) => item.id === id);
  if (!product) throw new Error("Product not found");
  return product;
}

export async function archiveProduct(id: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("products").update({ is_active: false }).eq("id", id);
  assertNoError(error, "Product not found");
  const { products } = await catalogTables();
  const product = products.find((item) => item.id === id);
  if (!product) throw new Error("Product not found");
  return product;
}

export async function setProductImage(id: string, imageUrl: string) {
  const supabase = createServiceClient();
  const { error } = await supabase.from("products").update({ image_url: imageUrl }).eq("id", id);
  assertNoError(error, "Product not found");
  const { products } = await catalogTables();
  const product = products.find((item) => item.id === id);
  if (!product) throw new Error("Product not found");
  return product;
}

export async function adjustInventory(productId: string, quantityOnHand: number) {
  if (!Number.isInteger(quantityOnHand) || quantityOnHand < 0) {
    throw new Error("quantity_on_hand must be a non-negative integer");
  }
  const supabase = createServiceClient();
  const { data: existing, error } = await supabase
    .from("inventory")
    .select("id, quantity_on_hand, low_stock_threshold")
    .eq("product_id", productId)
    .limit(1);
  assertNoError(error, "Could not load inventory");
  const previousQuantity = existing?.[0]?.quantity_on_hand ?? 0;
  const threshold = existing?.[0]?.low_stock_threshold ?? 5;
  if (existing?.[0]) {
    const { error: updateError } = await supabase
      .from("inventory")
      .update({ quantity_on_hand: quantityOnHand })
      .eq("id", existing[0].id);
    assertNoError(updateError, "Could not update inventory");
  } else {
    const { error: insertError } = await supabase.from("inventory").insert({
      product_id: productId,
      warehouse_id: DEFAULT_WAREHOUSE_ID,
      quantity_on_hand: quantityOnHand,
    });
    assertNoError(insertError, "Could not create inventory");
  }

  const { products } = await catalogTables();
  const product = products.find((item) => item.id === productId);
  if (!product) throw new Error("Product not found");
  await notifyIfLowStockBreached({
    sku: product.sku,
    name: product.name,
    previousQuantity,
    nextQuantity: quantityOnHand,
    threshold,
  });
  return {
    product_id: productId,
    quantity_on_hand: quantityOnHand,
    stock_status: deriveStockStatus(quantityOnHand, product.low_stock_threshold),
  };
}

export async function listBusinessAccounts() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("business_accounts")
    .select("id, clerk_org_id, company_name, tax_exempt, stripe_customer_id, created_at")
    .order("created_at", { ascending: false });
  assertNoError(error, "Could not load business accounts");
  return (data ?? []).map((account) => ({
    id: account.clerk_org_id ?? account.id,
    tax_exempt: account.tax_exempt,
    company_name: account.company_name,
    stripe_customer_id: account.stripe_customer_id,
    created_at: account.created_at,
  }));
}

export async function setTaxExempt(orgId: string, taxExempt: boolean, companyName?: string) {
  const supabase = createServiceClient();
  const { data: existing, error } = await supabase
    .from("business_accounts")
    .select("id, clerk_org_id, company_name, tax_exempt, stripe_customer_id, created_at")
    .or(`clerk_org_id.eq.${orgId},id.eq.${orgId}`)
    .maybeSingle();
  assertNoError(error, "Could not load business account");

  if (existing) {
    const { data, error: updateError } = await supabase
      .from("business_accounts")
      .update({
        tax_exempt: taxExempt,
        company_name: companyName ?? existing.company_name,
      })
      .eq("id", existing.id)
      .select("id, clerk_org_id, company_name, tax_exempt, stripe_customer_id, created_at")
      .single();
    assertNoError(updateError, "Could not update tax-exempt flag");
    if (!data) throw new Error("Could not update tax-exempt flag");
    return {
      id: data.clerk_org_id ?? data.id,
      tax_exempt: data.tax_exempt,
      company_name: data.company_name,
      stripe_customer_id: data.stripe_customer_id,
      created_at: data.created_at,
    };
  }

  const { data, error: insertError } = await supabase
    .from("business_accounts")
    .insert({
      clerk_org_id: orgId,
      company_name: companyName ?? orgId,
      tax_exempt: taxExempt,
      account_tier: "business",
    })
    .select("id, clerk_org_id, company_name, tax_exempt, stripe_customer_id, created_at")
    .single();
  assertNoError(insertError, "Could not create business account");
  if (!data) throw new Error("Could not create business account");
  return {
    id: data.clerk_org_id ?? data.id,
    tax_exempt: data.tax_exempt,
    company_name: data.company_name,
    stripe_customer_id: data.stripe_customer_id,
    created_at: data.created_at,
  };
}

export type { PriceTier, OrderStatus };
