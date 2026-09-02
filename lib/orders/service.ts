import { randomUUID } from "node:crypto";
import { PRODUCTS } from "@/lib/catalog/seed";
import { getCartSnapshot } from "@/lib/cart/service";
import { DELIVERY_METHODS } from "@/lib/pricing";
import { resolveCasePrice } from "@/lib/pricing";
import { mutateStore, readStoreLocked } from "@/lib/store/file-store";
import type { AccountTier, AddressRecord, OrderRecord, OrderStatus } from "@/types/commerce";

const ALLOWED: Record<OrderStatus, OrderStatus[]> = {
  pending: ["paid", "cancelled", "payment_failed"],
  paid: ["fulfilled", "cancelled"],
  fulfilled: [],
  cancelled: [],
  payment_failed: ["pending", "cancelled"],
};

export function assertStatusTransition(from: OrderStatus, to: OrderStatus) {
  if (!ALLOWED[from].includes(to)) {
    throw new Error(`Cannot move order from ${from} to ${to}`);
  }
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

  const order: OrderRecord = {
    id: `ord_${randomUUID().slice(0, 8)}`,
    user_id: options.userId,
    org_id: options.orgId,
    status: "pending",
    subtotal_cents: cart.totals.subtotal_cents,
    shipping_cents: cart.totals.shipping_cents,
    tax_cents: cart.totals.tax_cents,
    total_cents: cart.totals.total_cents,
    delivery_method: options.deliveryMethodId,
    shipping_address: {
      id: randomUUID(),
      user_id: options.userId,
      ...options.address,
    },
    items: cart.items.map((item) => ({
      product_id: item.product.id,
      sku: item.product.sku,
      name: item.product.name,
      cases: item.cases,
      unit_price_cents_at_purchase: item.unit_price_cents,
    })),
    stripe_payment_intent_id: null,
    created_at: new Date().toISOString(),
  };

  await mutateStore((store) => {
    store.orders.unshift(order);
    if (options.address.is_default) {
      for (const item of store.addresses) {
        if (item.user_id === options.userId) item.is_default = false;
      }
    }
    store.addresses.push(order.shipping_address!);
  });

  return order;
}

export async function attachPaymentIntent(orderId: string, paymentIntentId: string) {
  return mutateStore((store) => {
    const order = store.orders.find((item) => item.id === orderId);
    if (!order) throw new Error("Order not found");
    order.stripe_payment_intent_id = paymentIntentId;
    return order;
  });
}

export async function markOrderPaid(orderId: string) {
  return mutateStore((store) => {
    const order = store.orders.find((item) => item.id === orderId);
    if (!order) throw new Error("Order not found");
    if (order.status === "paid" || order.status === "fulfilled") return order;
    assertStatusTransition(order.status, "paid");
    order.status = "paid";
    for (const item of order.items) {
      const seedQty = PRODUCTS.find((product) => product.id === item.product_id)?.quantity_on_hand ?? 0;
      const storedProduct = store.products.find((product) => product.id === item.product_id);
      const current = store.inventory[item.product_id] ?? storedProduct?.quantity_on_hand ?? seedQty;
      store.inventory[item.product_id] = Math.max(0, current - item.cases);
    }
    store.carts[order.user_id] = [];
    return order;
  });
}

export async function markOrderPaymentFailed(orderId: string) {
  return mutateStore((store) => {
    const order = store.orders.find((item) => item.id === orderId);
    if (!order) throw new Error("Order not found");
    if (order.status === "payment_failed") return order;
    if (order.status === "paid" || order.status === "fulfilled") return order;
    assertStatusTransition(order.status, "payment_failed");
    order.status = "payment_failed";
    return order;
  });
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  if (status === "paid") return markOrderPaid(orderId);
  if (status === "payment_failed") return markOrderPaymentFailed(orderId);
  return mutateStore((store) => {
    const order = store.orders.find((item) => item.id === orderId);
    if (!order) throw new Error("Order not found");
    assertStatusTransition(order.status, status);
    order.status = status;
    return order;
  });
}

export async function listOrdersForUser(userId: string, orgId: string | null) {
  const store = await readStoreLocked();
  return store.orders.filter((order) => order.user_id === userId || (orgId && order.org_id === orgId));
}

export async function listAllOrders(status?: OrderStatus) {
  const store = await readStoreLocked();
  return status ? store.orders.filter((order) => order.status === status) : store.orders;
}

export async function getOrder(orderId: string) {
  const store = await readStoreLocked();
  return store.orders.find((order) => order.id === orderId) ?? null;
}

export async function getOrderByPaymentIntent(paymentIntentId: string) {
  const store = await readStoreLocked();
  return store.orders.find((order) => order.stripe_payment_intent_id === paymentIntentId) ?? null;
}

export async function reorderPreview(orderId: string, accountTier: AccountTier) {
  const order = await getOrder(orderId);
  if (!order) return null;

  const { getProductById } = await import("@/lib/catalog/query");
  const items = [];
  for (const item of order.items) {
    const product = await getProductById(item.product_id, accountTier, true);
    const currentPrice = product
      ? resolveCasePrice(product.price_tiers, item.cases, accountTier)
      : null;
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
  return mutateStore((store) => {
    const record: AddressRecord = { id: randomUUID(), user_id: userId, ...address };
    if (record.is_default) {
      for (const item of store.addresses) {
        if (item.user_id === userId) item.is_default = false;
      }
    }
    store.addresses.push(record);
    return record;
  });
}

export async function listAddresses(userId: string) {
  const store = await readStoreLocked();
  return store.addresses.filter((item) => item.user_id === userId);
}
