import { CATEGORIES, PRODUCTS } from "@/lib/catalog/seed";
import { deriveStockStatus, startingCasePrice } from "@/lib/pricing";
import { assertNoError, createServiceClient } from "@/lib/supabase/server";
import type { AccountTier, Category, Product, StockStatus } from "@/types/commerce";

export type ResolvedProduct = Product & {
  category: Category;
  stock_status: StockStatus;
  starting_price_cents: number;
};

type ProductRow = {
  id: string;
  sku: string;
  name: string;
  category_id: string;
  description: string;
  image_url: string | null;
  pack_size: string;
  unit_count: number;
  is_active: boolean;
  price_tiers: { min_cases: number; price_per_case_cents: number }[] | null;
  inventory: { quantity_on_hand: number; low_stock_threshold: number }[] | null;
};

function matchesSearch(product: Product, search: string) {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  const sku = product.sku.toLowerCase();
  return product.name.toLowerCase().includes(q) || sku === q || sku.startsWith(q);
}

function mapProduct(row: ProductRow): Product {
  const inventory = row.inventory ?? [];
  const quantity_on_hand = inventory.reduce((sum, item) => sum + item.quantity_on_hand, 0);
  const low_stock_threshold = inventory[0]?.low_stock_threshold ?? 5;
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    category_id: row.category_id,
    description: row.description,
    image_url: row.image_url,
    pack_size: row.pack_size,
    unit_count: row.unit_count,
    is_active: row.is_active,
    price_tiers: [...(row.price_tiers ?? [])].sort((a, b) => a.min_cases - b.min_cases),
    quantity_on_hand,
    low_stock_threshold,
  };
}

export async function catalogTables() {
  const supabase = createServiceClient();
  const [{ data: categories, error: categoryError }, { data: productRows, error: productError }] = await Promise.all([
    supabase.from("categories").select("id, name, slug, description"),
    supabase
      .from("products")
      .select("id, sku, name, category_id, description, image_url, pack_size, unit_count, is_active, price_tiers(min_cases, price_per_case_cents), inventory(quantity_on_hand, low_stock_threshold)"),
  ]);
  assertNoError(categoryError, "Could not load categories");
  assertNoError(productError, "Could not load products");

  const order = CATEGORIES.map((category) => category.slug);
  const sortedCategories = [...(categories ?? [])].sort((a, b) => {
    const left = order.indexOf(a.slug);
    const right = order.indexOf(b.slug);
    return (left === -1 ? 999 : left) - (right === -1 ? 999 : right);
  }) as Category[];

  const products = ((productRows ?? []) as ProductRow[]).map(mapProduct);
  const inventory = Object.fromEntries(products.map((product) => [product.id, product.quantity_on_hand]));

  return { products, categories: sortedCategories, inventory };
}

export async function listCategories(): Promise<Category[]> {
  const { categories } = await catalogTables();
  return categories;
}

export async function hydrateProduct(
  product: Product,
  accountTier: AccountTier,
  inventory?: Record<string, number>,
  categories?: Category[],
): Promise<ResolvedProduct> {
  const qtyMap = inventory ?? (await catalogTables()).inventory;
  const cats = categories ?? (await catalogTables()).categories;
  const quantity = qtyMap[product.id] ?? product.quantity_on_hand;
  const category = cats.find((item) => item.id === product.category_id);
  if (!category) {
    throw new Error(`Missing category ${product.category_id}`);
  }

  return {
    ...product,
    quantity_on_hand: quantity,
    category,
    stock_status: deriveStockStatus(quantity, product.low_stock_threshold),
    starting_price_cents: startingCasePrice(product.price_tiers, accountTier),
  };
}

export async function listProducts(options: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  accountTier: AccountTier;
  includeInactive?: boolean;
}) {
  const page = Math.max(1, options.page ?? 1);
  const limit = Math.min(48, Math.max(1, options.limit ?? 12));
  const category = options.category?.trim();
  const search = options.search?.trim();
  const { products, categories, inventory } = await catalogTables();

  let filtered = options.includeInactive ? [...products] : products.filter((product) => product.is_active);
  if (category && category !== "all") {
    const match = categories.find((item) => item.slug === category);
    if (match) {
      filtered = filtered.filter((product) => product.category_id === match.id);
    } else {
      filtered = [];
    }
  }
  if (search) {
    filtered = filtered.filter((product) => matchesSearch(product, search));
  }

  const total = filtered.length;
  const start = (page - 1) * limit;
  const slice = filtered.slice(start, start + limit);
  const resolved = await Promise.all(
    slice.map((product) => hydrateProduct(product, options.accountTier, inventory, categories)),
  );

  return {
    products: resolved,
    page,
    limit,
    total,
    total_pages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getProductBySku(sku: string, accountTier: AccountTier, includeInactive = false) {
  const { products, categories, inventory } = await catalogTables();
  const product = products.find(
    (item) => item.sku.toLowerCase() === sku.toLowerCase() && (includeInactive || item.is_active),
  );
  if (!product) return null;
  return hydrateProduct(product, accountTier, inventory, categories);
}

export async function getProductById(productId: string, accountTier: AccountTier, includeInactive = false) {
  const { products, categories, inventory } = await catalogTables();
  const product = products.find((item) => item.id === productId && (includeInactive || item.is_active));
  if (!product) return null;
  return hydrateProduct(product, accountTier, inventory, categories);
}

export { PRODUCTS, CATEGORIES };
