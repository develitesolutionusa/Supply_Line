import { getProductById, getProductBySku } from "@/lib/catalog/query";
import { calculateCartTotals, resolveCasePrice } from "@/lib/pricing";
import { loadTaxRules } from "@/lib/tax/rules";
import { ensureAppUser } from "@/lib/supabase/identity";
import { assertNoError, createServiceClient } from "@/lib/supabase/server";
import type { AccountTier, CartItemRecord } from "@/types/commerce";

async function getOrCreateCart(clerkUserId: string) {
  const supabase = createServiceClient();
  const user = await ensureAppUser(clerkUserId);
  const { data: existing, error } = await supabase.from("carts").select("id, user_id").eq("user_id", user.id).maybeSingle();
  assertNoError(error, "Could not load cart");
  if (existing) return { user, cart: existing };

  const { data, error: insertError } = await supabase
    .from("carts")
    .insert({ user_id: user.id })
    .select("id, user_id")
    .single();
  if (insertError?.code === "23505") {
    const { data: raced, error: racedError } = await supabase
      .from("carts")
      .select("id, user_id")
      .eq("user_id", user.id)
      .single();
    assertNoError(racedError, "Could not load cart");
    if (!raced) throw new Error("Could not load cart");
    return { user, cart: raced };
  }
  assertNoError(insertError, "Could not create cart");
  if (!data) throw new Error("Could not create cart");
  return { user, cart: data };
}

async function listCartItems(cartId: string): Promise<CartItemRecord[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("cart_items").select("id, product_id, cases").eq("cart_id", cartId);
  assertNoError(error, "Could not load cart items");
  return (data ?? []) as CartItemRecord[];
}

export async function getCartSnapshot(options: {
  userId: string;
  accountTier: AccountTier;
  taxExempt: boolean;
  deliveryMethodId?: string;
  shippingState?: string;
}) {
  const { cart } = await getOrCreateCart(options.userId);
  const items = await listCartItems(cart.id);
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
    taxRules: await loadTaxRules(),
  });

  return {
    items: resolved,
    item_count: resolved.reduce((sum, item) => sum + item.cases, 0),
    totals,
    delivery_method_id: deliveryMethodId,
  };
}

async function assertCasesAvailable(productId: string, cases: number) {
  const product = await getProductById(productId, "individual", true);
  if (!product?.is_active) {
    throw new Error("Product is unavailable.");
  }
  if (product.quantity_on_hand < cases) {
    throw new Error(
      product.quantity_on_hand <= 0
        ? "Out of stock."
        : `Only ${product.quantity_on_hand} cases available.`,
    );
  }
}

export async function upsertCartItem(userId: string, productId: string, cases: number) {
  if (!Number.isInteger(cases) || cases < 1) {
    throw new Error("Cases must be a positive integer.");
  }
  await assertCasesAvailable(productId, cases);

  const supabase = createServiceClient();
  const { cart } = await getOrCreateCart(userId);
  const { data: existing, error } = await supabase
    .from("cart_items")
    .select("id, product_id, cases")
    .eq("cart_id", cart.id)
    .eq("product_id", productId)
    .maybeSingle();
  assertNoError(error, "Could not load cart item");

  if (existing) {
    const { data, error: updateError } = await supabase
      .from("cart_items")
      .update({ cases })
      .eq("id", existing.id)
      .select("id, product_id, cases")
      .single();
    assertNoError(updateError, "Could not update cart item");
    return data as CartItemRecord;
  }

  const { data, error: insertError } = await supabase
    .from("cart_items")
    .insert({ cart_id: cart.id, product_id: productId, cases })
    .select("id, product_id, cases")
    .single();
  assertNoError(insertError, "Could not add cart item");
  return data as CartItemRecord;
}

export async function addCasesToCart(userId: string, productId: string, cases: number) {
  const supabase = createServiceClient();
  const { cart } = await getOrCreateCart(userId);
  const { data: existing, error } = await supabase
    .from("cart_items")
    .select("id, cases")
    .eq("cart_id", cart.id)
    .eq("product_id", productId)
    .maybeSingle();
  assertNoError(error, "Could not load cart item");
  return upsertCartItem(userId, productId, (existing?.cases ?? 0) + cases);
}

export async function updateCartItem(userId: string, itemId: string, cases: number) {
  if (!Number.isInteger(cases) || cases < 1) {
    throw new Error("Cases must be a positive integer.");
  }

  const supabase = createServiceClient();
  const { cart } = await getOrCreateCart(userId);
  const { data: existing, error: existingError } = await supabase
    .from("cart_items")
    .select("product_id")
    .eq("id", itemId)
    .eq("cart_id", cart.id)
    .maybeSingle();
  assertNoError(existingError, "Could not load cart item");
  if (!existing) throw new Error("Cart item not found.");
  await assertCasesAvailable(existing.product_id, cases);

  const { data, error } = await supabase
    .from("cart_items")
    .update({ cases })
    .eq("id", itemId)
    .eq("cart_id", cart.id)
    .select("id, product_id, cases")
    .maybeSingle();
  assertNoError(error, "Could not update cart item");
  if (!data) throw new Error("Cart item not found.");
  return data as CartItemRecord;
}

export async function removeCartItem(userId: string, itemId: string) {
  const supabase = createServiceClient();
  const { cart } = await getOrCreateCart(userId);
  const { error } = await supabase.from("cart_items").delete().eq("id", itemId).eq("cart_id", cart.id);
  assertNoError(error, "Could not remove cart item");
}

export async function clearCart(userId: string) {
  const supabase = createServiceClient();
  const { cart } = await getOrCreateCart(userId);
  const { error } = await supabase.from("cart_items").delete().eq("cart_id", cart.id);
  assertNoError(error, "Could not clear cart");
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
    try {
      await addCasesToCart(userId, product.id, qty);
      results.push({ sku, qty, ok: true });
    } catch (error) {
      results.push({
        sku,
        qty,
        ok: false,
        reason: error instanceof Error ? error.message : "Could not add to cart",
      });
    }
  }

  return results;
}
