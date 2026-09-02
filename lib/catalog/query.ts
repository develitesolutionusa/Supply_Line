import { CATEGORIES, PRODUCTS } from "@/lib/catalog/seed";
import { deriveStockStatus, startingCasePrice } from "@/lib/pricing";
import { mutateStore, readStoreLocked, type StoreShape } from "@/lib/store/file-store";
import type { AccountTier, Category, Product, StockStatus } from "@/types/commerce";

export type ResolvedProduct = Product & {
  category: Category;
  stock_status: StockStatus;
  starting_price_cents: number;
};

function matchesSearch(product: Product, search: string) {
  const q = search.trim().toLowerCase();
  if (!q) return true;
  const sku = product.sku.toLowerCase();
  return product.name.toLowerCase().includes(q) || sku === q || sku.startsWith(q);
}

export function ensureCatalog(store: StoreShape) {
  if (store.products.length === 0) {
    store.products = structuredClone(PRODUCTS);
  }
  if (store.categories.length === 0) {
    store.categories = structuredClone(CATEGORIES);
  }
}

export async function catalogTables() {
  const store = await readStoreLocked();
  return {
    products: store.products.length ? store.products : PRODUCTS,
    categories: store.categories.length ? store.categories : CATEGORIES,
    inventory: store.inventory,
  };
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

export async function persistCatalogSeed() {
  return mutateStore((store) => {
    ensureCatalog(store);
    return store.products;
  });
}

export { PRODUCTS, CATEGORIES };
