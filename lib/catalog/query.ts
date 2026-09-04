import { pageBounds, productSearchFilter } from "@/lib/catalog/search";
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
  const supabase = createServiceClient();
  const { data: categories, error } = await supabase.from("categories").select("id, name, slug, description");
  assertNoError(error, "Could not load categories");
  const order = CATEGORIES.map((category) => category.slug);
  return [...(categories ?? [])].sort((a, b) => {
    const left = order.indexOf(a.slug);
    const right = order.indexOf(b.slug);
    return (left === -1 ? 999 : left) - (right === -1 ? 999 : right);
  }) as Category[];
}

export async function hydrateProduct(
  product: Product,
  accountTier: AccountTier,
  inventory?: Record<string, number>,
  categories?: Category[],
): Promise<ResolvedProduct> {
  const quantity = inventory?.[product.id] ?? product.quantity_on_hand;
  const cats = categories ?? (await listCategories());
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

const PRODUCT_SELECT =
  "id, sku, name, category_id, description, image_url, pack_size, unit_count, is_active, price_tiers(min_cases, price_per_case_cents), inventory(quantity_on_hand, low_stock_threshold)";

export async function listProducts(options: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  accountTier: AccountTier;
  includeInactive?: boolean;
  inStock?: boolean;
  sort?: "name" | "price";
}) {
  const requestedPage = Math.max(1, options.page ?? 1);
  const requestedLimit = Math.min(48, Math.max(1, options.limit ?? 12));
  const category = options.category?.trim();
  const search = options.search?.trim();
  const categories = await listCategories();

  let categoryId: string | undefined;
  if (category && category !== "all") {
    categoryId = categories.find((item) => item.slug === category)?.id;
    if (!categoryId) {
      const { page, limit, total_pages } = pageBounds(requestedPage, requestedLimit, 0);
      return { products: [], page, limit, total: 0, total_pages };
    }
  }

  const supabase = createServiceClient();
  let query = supabase.from("products").select(PRODUCT_SELECT, { count: "exact" });
  if (!options.includeInactive) {
    query = query.eq("is_active", true);
  }
  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }
  const searchFilter = search ? productSearchFilter(search) : null;
  if (searchFilter) {
    query = query.or(searchFilter);
  }

  const paginateInMemory = Boolean(options.inStock || options.sort === "price");
  if (paginateInMemory) {
    query = query.order("name").limit(48);
  } else {
    const start = (requestedPage - 1) * requestedLimit;
    query = query.order("name").range(start, start + requestedLimit - 1);
  }

  const { data, error, count } = await query;
  assertNoError(error, "Could not load products");
  const products = ((data ?? []) as ProductRow[]).map(mapProduct);
  const inventory = Object.fromEntries(products.map((product) => [product.id, product.quantity_on_hand]));
  let resolved = await Promise.all(
    products.map((product) => hydrateProduct(product, options.accountTier, inventory, categories)),
  );
  if (options.inStock) {
    resolved = resolved.filter((product) => product.stock_status !== "out_of_stock");
  }
  if (options.sort === "price") {
    resolved = [...resolved].sort((left, right) => left.starting_price_cents - right.starting_price_cents);
  }
  const total = paginateInMemory ? resolved.length : (count ?? resolved.length);
  const { page, limit, total_pages } = pageBounds(requestedPage, requestedLimit, total);
  const start = (page - 1) * limit;
  const paged = paginateInMemory ? resolved.slice(start, start + limit) : resolved;

  return {
    products: paged,
    page,
    limit,
    total,
    total_pages,
  };
}

export async function getProductBySku(sku: string, accountTier: AccountTier, includeInactive = false) {
  const supabase = createServiceClient();
  let query = supabase.from("products").select(PRODUCT_SELECT).ilike("sku", sku);
  if (!includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query.maybeSingle();
  assertNoError(error, "Could not load product");
  if (!data) return null;
  return hydrateProduct(mapProduct(data as ProductRow), accountTier);
}

export async function getProductById(productId: string, accountTier: AccountTier, includeInactive = false) {
  const supabase = createServiceClient();
  let query = supabase.from("products").select(PRODUCT_SELECT).eq("id", productId);
  if (!includeInactive) query = query.eq("is_active", true);
  const { data, error } = await query.maybeSingle();
  assertNoError(error, "Could not load product");
  if (!data) return null;
  return hydrateProduct(mapProduct(data as ProductRow), accountTier);
}

export { PRODUCTS, CATEGORIES };
