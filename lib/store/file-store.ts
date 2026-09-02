import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AddressRecord, CartItemRecord, Category, OrderRecord, Product } from "@/types/commerce";

export type StoredUser = {
  id: string;
  clerk_user_id: string;
  email: string;
  role: "admin" | "buyer" | "staff";
  business_account_id: string | null;
  created_at: string;
};

export type BusinessAccountRecord = {
  tax_exempt: boolean;
  company_name: string;
  stripe_customer_id: string | null;
  created_at: string;
};

export type StoreShape = {
  carts: Record<string, CartItemRecord[]>;
  orders: OrderRecord[];
  addresses: AddressRecord[];
  inventory: Record<string, number>;
  businessAccounts: Record<string, BusinessAccountRecord>;
  products: Product[];
  categories: Category[];
  users: StoredUser[];
};

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

const emptyStore = (): StoreShape => ({
  carts: {},
  orders: [],
  addresses: [],
  inventory: {},
  businessAccounts: {},
  products: [],
  categories: [],
  users: [],
});

let queue: Promise<unknown> = Promise.resolve();

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn, fn);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function readStore(): Promise<StoreShape> {
  try {
    const raw = await readFile(DATA_FILE, "utf8");
    const parsed = JSON.parse(raw) as Partial<StoreShape>;
    return {
      carts: parsed.carts ?? {},
      orders: parsed.orders ?? [],
      addresses: parsed.addresses ?? [],
      inventory: parsed.inventory ?? {},
      businessAccounts: parsed.businessAccounts ?? {},
      products: parsed.products ?? [],
      categories: parsed.categories ?? [],
      users: parsed.users ?? [],
    };
  } catch {
    return emptyStore();
  }
}

async function writeStore(store: StoreShape) {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf8");
}

export function mutateStore<T>(mutator: (store: StoreShape) => T | Promise<T>): Promise<T> {
  return withLock(async () => {
    const store = await readStore();
    const result = await mutator(store);
    await writeStore(store);
    return result;
  });
}

export function readStoreLocked(): Promise<StoreShape> {
  return withLock(() => readStore());
}
