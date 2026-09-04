import { randomUUID } from "node:crypto";
import { getCartSnapshot, clearCart } from "@/lib/cart/service";
import { notifyIfLowStockBreached } from "@/lib/inventory/alerts";
import { pageBounds } from "@/lib/pagination";
import { DELIVERY_METHODS, resolveCasePrice } from "@/lib/pricing";
import { ensureAppUser, ensureBusinessAccount } from "@/lib/supabase/identity";
import { syncClerkIdentity } from "@/lib/sync/clerk";
import { assertNoError, createServiceClient } from "@/lib/supabase/server";
import type { AccountTier, AddressRecord, OrderRecord, OrderStatus } from "@/types/commerce";

const ALLOWED: Record<OrderStatus, OrderStatus[]> = {
  pending: ["paid", "cancelled", "payment_failed"],
  paid: ["fulfilled", "cancelled"],
  fulfilled: [],
  cancelled: [],
  payment_failed: ["pending", "cancelled"],
};

type OrderRow = {
  id: string;
  user_id: string;
  business_account_id: string | null;
  status: OrderStatus;
  subtotal_cents: number;
  shipping_cents: number;
  tax_cents: number;
  total_cents: number;
  stripe_payment_intent_id: string | null;
  delivery_method: string;
  shipping_address_id: string | null;
  created_at: string;
};

type AddressRow = {
  id: string;
  user_id: string | null;
  label: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  is_default: boolean;
};

type OrderItemRow = {
  product_id: string;
  cases: number;
  unit_price_cents_at_purchase: number;
  products: { sku: string; name: string } | { sku: string; name: string }[] | null;
};

export function assertStatusTransition(from: OrderStatus, to: OrderStatus) {
  if (!ALLOWED[from].includes(to)) {
    throw new Error(`Cannot move order from ${from} to ${to}`);
  }
}

async function mapOrder(row: OrderRow): Promise<OrderRecord> {
  const supabase = createServiceClient();
  const [{ data: user }, { data: account }, { data: address }, { data: items }] = await Promise.all([
    supabase.from("users").select("clerk_user_id").eq("id", row.user_id).maybeSingle(),
    row.business_account_id
      ? supabase.from("business_accounts").select("clerk_org_id").eq("id", row.business_account_id).maybeSingle()
      : Promise.resolve({ data: null }),
    row.shipping_address_id
      ? supabase
          .from("addresses")
          .select("id, user_id, label, line1, line2, city, state, zip, is_default")
          .eq("id", row.shipping_address_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("order_items")
      .select("product_id, cases, unit_price_cents_at_purchase, products(sku, name)")
      .eq("order_id", row.id),
  ]);

  const shipping = address as AddressRow | null;
  return {
    id: row.id,
    user_id: (user?.clerk_user_id as string | undefined) ?? row.user_id,
    org_id: (account?.clerk_org_id as string | null | undefined) ?? null,
    status: row.status,
    subtotal_cents: row.subtotal_cents,
    shipping_cents: row.shipping_cents,
    tax_cents: row.tax_cents,
    total_cents: row.total_cents,
    delivery_method: row.delivery_method,
    shipping_address: shipping
      ? {
          id: shipping.id,
          user_id: (user?.clerk_user_id as string | undefined) ?? row.user_id,
          label: shipping.label,
          line1: shipping.line1,
          line2: shipping.line2,
          city: shipping.city,
          state: shipping.state,
          zip: shipping.zip,
          is_default: shipping.is_default,
        }
      : null,
    items: ((items ?? []) as OrderItemRow[]).map((item) => {
      const product = Array.isArray(item.products) ? item.products[0] : item.products;
      return {
        product_id: item.product_id,
        sku: product?.sku ?? "",
        name: product?.name ?? "",
        cases: item.cases,
        unit_price_cents_at_purchase: item.unit_price_cents_at_purchase,
      };
    }),
    stripe_payment_intent_id: row.stripe_payment_intent_id,
    created_at: row.created_at,
  };
}

export async function placeOrder(options: {
  userId: string;
  orgId: string | null;
  accountTier: AccountTier;
  taxExempt: boolean;
  deliveryMethodId: string;
  address: Omit<AddressRecord, "id" | "user_id">;
}) {
  if (!DELIVERY_METHODS.some((method) => method.id === options.deliveryMethodId)) {
    throw new Error("Invalid delivery method");
  }

  const cart = await getCartSnapshot({
    userId: options.userId,
    accountTier: options.accountTier,
    taxExempt: options.taxExempt,
    deliveryMethodId: options.deliveryMethodId,
    shippingState: options.address.state,
  });

  if (cart.items.length === 0) {
    throw new Error("Cart is empty");
  }

  const supabase = createServiceClient();
  const { user, account: business } = await syncClerkIdentity({
    clerkUserId: options.userId,
    clerkOrgId: options.orgId,
  });

  if (options.address.is_default) {
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
  }

  const { data: address, error: addressError } = await supabase
    .from("addresses")
    .insert({
      user_id: user.id,
      business_account_id: business?.id ?? null,
      label: options.address.label,
      line1: options.address.line1,
      line2: options.address.line2,
      city: options.address.city,
      state: options.address.state,
      zip: options.address.zip,
      is_default: options.address.is_default,
    })
    .select("id")
    .single();
  assertNoError(addressError, "Could not save shipping address");

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      user_id: user.id,
      business_account_id: business?.id ?? null,
      status: "pending",
      subtotal_cents: cart.totals.subtotal_cents,
      shipping_cents: cart.totals.shipping_cents,
      tax_cents: cart.totals.tax_cents,
      total_cents: cart.totals.total_cents,
      delivery_method: options.deliveryMethodId,
      shipping_address_id: address?.id ?? null,
    })
    .select("*")
    .single();
  assertNoError(orderError, "Could not create order");
  if (!order) throw new Error("Could not create order");

  const { error: itemsError } = await supabase.from("order_items").insert(
    cart.items.map((item) => ({
      order_id: order.id,
      product_id: item.product.id,
      cases: item.cases,
      unit_price_cents_at_purchase: item.unit_price_cents,
    })),
  );
  assertNoError(itemsError, "Could not create order items");

  return mapOrder(order as OrderRow);
}

export async function attachPaymentIntent(orderId: string, paymentIntentId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ stripe_payment_intent_id: paymentIntentId })
    .eq("id", orderId)
    .select("*")
    .single();
  assertNoError(error, "Order not found");
  return mapOrder(data as OrderRow);
}

export async function markOrderPaid(orderId: string) {
  const supabase = createServiceClient();
  const { data: order, error } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  assertNoError(error, "Order not found");
  if (!order) throw new Error("Order not found");
  if (order.status === "paid" || order.status === "fulfilled") {
    return { order: await mapOrder(order as OrderRow), newlyPaid: false };
  }
  assertStatusTransition(order.status as OrderStatus, "paid");

  const { data: items, error: itemsError } = await supabase
    .from("order_items")
    .select("product_id, cases")
    .eq("order_id", orderId);
  assertNoError(itemsError, "Could not load order items");

  for (const item of items ?? []) {
    const { data: inventoryRows, error: inventoryError } = await supabase
      .from("inventory")
      .select("id, quantity_on_hand, low_stock_threshold, product_id")
      .eq("product_id", item.product_id);
    assertNoError(inventoryError, "Could not load inventory");
    const { data: product } = await supabase
      .from("products")
      .select("sku, name")
      .eq("id", item.product_id)
      .maybeSingle();
    let remaining = item.cases as number;
    for (const row of inventoryRows ?? []) {
      if (remaining <= 0) break;
      const take = Math.min(row.quantity_on_hand, remaining);
      const nextQuantity = Math.max(0, row.quantity_on_hand - take);
      const { error: updateError } = await supabase
        .from("inventory")
        .update({ quantity_on_hand: nextQuantity })
        .eq("id", row.id);
      assertNoError(updateError, "Could not decrement inventory");
      remaining -= take;
      await notifyIfLowStockBreached({
        sku: product?.sku ?? item.product_id,
        name: product?.name,
        previousQuantity: row.quantity_on_hand,
        nextQuantity,
        threshold: row.low_stock_threshold,
      });
    }
  }

  const { data: updated, error: updateError } = await supabase
    .from("orders")
    .update({ status: "paid" })
    .eq("id", orderId)
    .select("*")
    .single();
  assertNoError(updateError, "Could not mark order paid");

  const { data: user } = await supabase.from("users").select("clerk_user_id").eq("id", order.user_id).maybeSingle();
  if (user?.clerk_user_id) {
    await clearCart(user.clerk_user_id);
  }

  return { order: await mapOrder(updated as OrderRow), newlyPaid: true };
}

export async function markOrderPaymentFailed(orderId: string) {
  const supabase = createServiceClient();
  const { data: order, error } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  assertNoError(error, "Order not found");
  if (!order) throw new Error("Order not found");
  if (order.status === "payment_failed") return mapOrder(order as OrderRow);
  if (order.status === "paid" || order.status === "fulfilled") return mapOrder(order as OrderRow);
  assertStatusTransition(order.status as OrderStatus, "payment_failed");
  const { data, error: updateError } = await supabase
    .from("orders")
    .update({ status: "payment_failed" })
    .eq("id", orderId)
    .select("*")
    .single();
  assertNoError(updateError, "Could not mark payment failed");
  return mapOrder(data as OrderRow);
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  if (status === "paid") {
    const result = await markOrderPaid(orderId);
    return result.order;
  }
  if (status === "payment_failed") return markOrderPaymentFailed(orderId);
  const supabase = createServiceClient();
  const { data: order, error } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  assertNoError(error, "Order not found");
  if (!order) throw new Error("Order not found");
  assertStatusTransition(order.status as OrderStatus, status);
  const { data, error: updateError } = await supabase.from("orders").update({ status }).eq("id", orderId).select("*").single();
  assertNoError(updateError, "Could not update order status");
  return mapOrder(data as OrderRow);
}

export async function listOrdersForUser(
  userId: string,
  orgId: string | null,
  options?: { page?: number; limit?: number },
) {
  const supabase = createServiceClient();
  const user = await ensureAppUser(userId);
  const business = orgId ? await ensureBusinessAccount(orgId) : null;
  let query = supabase.from("orders").select("*", { count: "exact" }).order("created_at", { ascending: false });
  if (business) {
    query = query.or(`user_id.eq.${user.id},business_account_id.eq.${business.id}`);
  } else {
    query = query.eq("user_id", user.id);
  }
  const requestedPage = Math.max(1, options?.page ?? 1);
  const requestedLimit = Math.min(50, Math.max(1, options?.limit ?? 20));
  const start = (requestedPage - 1) * requestedLimit;
  const { data, error, count } = await query.range(start, start + requestedLimit - 1);
  assertNoError(error, "Could not load orders");
  const total = count ?? (data ?? []).length;
  const { page, limit, total_pages } = pageBounds(requestedPage, requestedLimit, total, 50);
  return {
    orders: await Promise.all(((data ?? []) as OrderRow[]).map(mapOrder)),
    page,
    limit,
    total,
    total_pages,
  };
}

export async function listAllOrders(status?: OrderStatus) {
  const supabase = createServiceClient();
  let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  assertNoError(error, "Could not load orders");
  return Promise.all(((data ?? []) as OrderRow[]).map(mapOrder));
}

export async function getOrder(orderId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
  assertNoError(error, "Could not load order");
  if (!data) return null;
  return mapOrder(data as OrderRow);
}

export async function getOrderByPaymentIntent(paymentIntentId: string) {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("stripe_payment_intent_id", paymentIntentId)
    .maybeSingle();
  assertNoError(error, "Could not load order");
  if (!data) return null;
  return mapOrder(data as OrderRow);
}

export async function reorderPreview(orderId: string, accountTier: AccountTier) {
  const order = await getOrder(orderId);
  if (!order) return null;

  const { getProductById } = await import("@/lib/catalog/query");
  const items = [];
  for (const item of order.items) {
    const product = await getProductById(item.product_id, accountTier, true);
    const currentPrice = product ? resolveCasePrice(product.price_tiers, item.cases, accountTier) : null;
    items.push({
      ...item,
      available: Boolean(product?.is_active) && product?.stock_status !== "out_of_stock",
      current_price_cents: currentPrice,
      price_changed: currentPrice !== null && currentPrice !== item.unit_price_cents_at_purchase,
      out_of_stock: !product || product.stock_status === "out_of_stock",
      current_name: product?.name ?? item.name,
    });
  }
  return { order, items };
}

export async function saveAddress(userId: string, address: Omit<AddressRecord, "id" | "user_id">) {
  const supabase = createServiceClient();
  const user = await ensureAppUser(userId);
  if (address.is_default) {
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
  }
  const { data, error } = await supabase
    .from("addresses")
    .insert({
      id: randomUUID(),
      user_id: user.id,
      label: address.label,
      line1: address.line1,
      line2: address.line2,
      city: address.city,
      state: address.state,
      zip: address.zip,
      is_default: address.is_default,
    })
    .select("id, user_id, label, line1, line2, city, state, zip, is_default")
    .single();
  assertNoError(error, "Could not save address");
  return {
    ...(data as AddressRow),
    user_id: userId,
  } satisfies AddressRecord;
}

export async function listAddresses(userId: string) {
  const supabase = createServiceClient();
  const user = await ensureAppUser(userId);
  const { data, error } = await supabase
    .from("addresses")
    .select("id, user_id, label, line1, line2, city, state, zip, is_default")
    .eq("user_id", user.id);
  assertNoError(error, "Could not load addresses");
  return ((data ?? []) as AddressRow[]).map((item) => ({
    ...item,
    user_id: userId,
  })) satisfies AddressRecord[];
}
