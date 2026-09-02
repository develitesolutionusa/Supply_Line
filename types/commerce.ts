export type AccountTier = "business" | "individual";

export type StockStatus = "in_stock" | "low_stock" | "out_of_stock";

export type OrderStatus = "pending" | "paid" | "fulfilled" | "cancelled" | "payment_failed";

export type PriceTier = {
  min_cases: number;
  price_per_case_cents: number;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
};

export type Product = {
  id: string;
  sku: string;
  name: string;
  category_id: string;
  description: string;
  image_url: string | null;
  pack_size: string;
  unit_count: number;
  is_active: boolean;
  price_tiers: PriceTier[];
  quantity_on_hand: number;
  low_stock_threshold: number;
};

export type DeliveryMethod = {
  id: string;
  label: string;
  description: string;
  shipping_cents: number | null;
};

export type CartItemRecord = {
  id: string;
  product_id: string;
  cases: number;
};

export type AddressRecord = {
  id: string;
  user_id: string;
  label: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  is_default: boolean;
};

export type OrderItemRecord = {
  product_id: string;
  sku: string;
  name: string;
  cases: number;
  unit_price_cents_at_purchase: number;
};

export type OrderRecord = {
  id: string;
  user_id: string;
  org_id: string | null;
  status: OrderStatus;
  subtotal_cents: number;
  shipping_cents: number;
  tax_cents: number;
  total_cents: number;
  delivery_method: string;
  shipping_address: AddressRecord | null;
  items: OrderItemRecord[];
  stripe_payment_intent_id: string | null;
  created_at: string;
};

export type CartTotals = {
  subtotal_cents: number;
  shipping_cents: number;
  tax_cents: number;
  total_cents: number;
  free_shipping_threshold_cents: number;
  remaining_for_free_shipping_cents: number;
};
