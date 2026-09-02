import { writeFileSync } from "node:fs";
import { CATEGORIES, PRODUCTS } from "../../lib/catalog/seed";
import { TAX_RULES } from "../../lib/pricing";

const sql: string[] = [
  "-- Seed generated from lib/catalog/seed.ts. Do not edit by hand.",
  "insert into public.addresses (id, label, line1, city, state, zip) values",
  "  ('00000000-0000-0000-0000-000000000001', 'Warehouse', '100 Freight Way', 'Dallas', 'TX', '75201');",
  "",
  "insert into public.warehouses (id, name, address_id) values",
  "  ('00000000-0000-0000-0000-000000000010', 'Dallas DC', '00000000-0000-0000-0000-000000000001');",
  "",
];

sql.push("insert into public.categories (id, name, slug, description) values");
sql.push(
  CATEGORIES.map(
    (category, index) =>
      `  ('${uuidFrom(category.id)}', ${lit(category.name)}, ${lit(category.slug)}, ${lit(category.description)})${
        index === CATEGORIES.length - 1 ? ";" : ","
      }`,
  ).join("\n"),
);
sql.push("");

sql.push(
  "insert into public.products (id, sku, name, category_id, description, image_url, pack_size, unit_count, is_active) values",
);
sql.push(
  PRODUCTS.map(
    (product, index) =>
      `  ('${uuidFrom(product.id)}', ${lit(product.sku)}, ${lit(product.name)}, '${uuidFrom(product.category_id)}', ${lit(product.description)}, null, ${lit(product.pack_size)}, ${product.unit_count}, ${product.is_active})${
        index === PRODUCTS.length - 1 ? ";" : ","
      }`,
  ).join("\n"),
);
sql.push("");

sql.push("insert into public.price_tiers (product_id, min_cases, price_per_case_cents) values");
const tiers = PRODUCTS.flatMap((product) =>
  product.price_tiers.map((tier) => `  ('${uuidFrom(product.id)}', ${tier.min_cases}, ${tier.price_per_case_cents})`),
);
sql.push(tiers.map((line, index) => (index === tiers.length - 1 ? `${line};` : `${line},`)).join("\n"));
sql.push("");

sql.push(
  "insert into public.inventory (product_id, warehouse_id, quantity_on_hand, low_stock_threshold) values",
);
sql.push(
  PRODUCTS.map(
    (product, index) =>
      `  ('${uuidFrom(product.id)}', '00000000-0000-0000-0000-000000000010', ${product.quantity_on_hand}, ${product.low_stock_threshold})${
        index === PRODUCTS.length - 1 ? ";" : ","
      }`,
  ).join("\n"),
);
sql.push("");

const taxEntries = Object.entries(TAX_RULES);
sql.push("insert into public.tax_rules (state_code, rate_percent) values");
sql.push(
  taxEntries
    .map(
      ([state, rate], index) =>
        `  (${lit(state)}, ${rate})${index === taxEntries.length - 1 ? ";" : ","}`,
    )
    .join("\n"),
);

writeFileSync(new URL("./../migrations/20240903000004_seed.sql", import.meta.url), `${sql.join("\n")}\n`);

function lit(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function uuidFrom(id: string) {
  const hex = Buffer.from(id).toString("hex").padEnd(32, "0").slice(0, 32);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
