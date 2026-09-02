export type CartResponse = {
  items: {
    id: string;
    cases: number;
    unit_price_cents: number;
    line_total_cents: number;
    product: {
      id: string;
      sku: string;
      name: string;
      pack_size: string;
      stock_status: string;
      image_url?: string | null;
    };
  }[];
  item_count: number;
  totals: {
    subtotal_cents: number;
    shipping_cents: number;
    tax_cents: number;
    total_cents: number;
    free_shipping_threshold_cents: number;
    remaining_for_free_shipping_cents: number;
  };
  error?: string;
};

export function emitCartUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("cart-updated"));
  }
}

export async function fetchCart(): Promise<CartResponse | null> {
  const response = await fetch("/api/cart", { cache: "no-store" });
  if (response.status === 401) return null;
  if (!response.ok) throw new Error("Could not load cart");
  return response.json();
}

export async function addToCart(productId: string, cases: number) {
  const response = await fetch("/api/cart/items", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: productId, cases }),
  });
  const data = await response.json();
  if (response.status === 401) {
    window.location.href = `/sign-in?redirect_url=${encodeURIComponent(window.location.pathname)}`;
    return null;
  }
  if (!response.ok) {
    throw new Error(data.error ?? "Could not add to cart");
  }
  emitCartUpdated();
  return data as CartResponse;
}

export async function patchCartItem(id: string, cases: number) {
  const response = await fetch(`/api/cart/items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cases }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Could not update cart");
  emitCartUpdated();
  return data as CartResponse;
}

export async function deleteCartItem(id: string) {
  const response = await fetch(`/api/cart/items/${id}`, { method: "DELETE" });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error ?? "Could not remove item");
  emitCartUpdated();
  return data as CartResponse;
}
