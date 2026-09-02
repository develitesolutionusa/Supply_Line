create type public.account_tier as enum ('business', 'individual');
create type public.user_role as enum ('admin', 'buyer', 'staff');
create type public.order_status as enum ('pending', 'paid', 'fulfilled', 'cancelled', 'payment_failed');

create table public.business_accounts (
  id uuid primary key default gen_random_uuid(),
  clerk_org_id text unique,
  company_name text not null,
  billing_address_id uuid,
  tax_exempt boolean not null default false,
  account_tier public.account_tier not null default 'business',
  stripe_customer_id text,
  created_at timestamptz not null default now()
);

create table public.users (
  id uuid primary key default gen_random_uuid(),
  clerk_user_id text not null unique,
  business_account_id uuid references public.business_accounts (id) on delete set null,
  role public.user_role not null default 'buyer',
  email text not null,
  created_at timestamptz not null default now()
);

create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  business_account_id uuid references public.business_accounts (id) on delete cascade,
  user_id uuid references public.users (id) on delete cascade,
  label text not null default 'Shipping',
  line1 text not null,
  line2 text not null default '',
  city text not null,
  state text not null,
  zip text not null,
  is_default boolean not null default false
);

alter table public.business_accounts
  add constraint business_accounts_billing_address_fk
  foreign key (billing_address_id) references public.addresses (id) on delete set null;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default ''
);

create table public.warehouses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address_id uuid references public.addresses (id) on delete set null
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  sku text not null unique,
  name text not null,
  category_id uuid not null references public.categories (id) on delete restrict,
  description text not null default '',
  image_url text,
  pack_size text not null,
  unit_count integer not null default 1,
  is_active boolean not null default true
);

create table public.price_tiers (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  min_cases integer not null check (min_cases >= 1),
  price_per_case_cents integer not null check (price_per_case_cents >= 0),
  unique (product_id, min_cases)
);

create table public.inventory (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  warehouse_id uuid not null references public.warehouses (id) on delete restrict,
  quantity_on_hand integer not null default 0 check (quantity_on_hand >= 0),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  unique (product_id, warehouse_id)
);

create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  cases integer not null check (cases >= 1),
  unique (cart_id, product_id)
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete restrict,
  business_account_id uuid references public.business_accounts (id) on delete set null,
  status public.order_status not null default 'pending',
  subtotal_cents integer not null,
  shipping_cents integer not null,
  tax_cents integer not null,
  total_cents integer not null,
  stripe_payment_intent_id text unique,
  delivery_method text not null,
  shipping_address_id uuid references public.addresses (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  cases integer not null check (cases >= 1),
  unit_price_cents_at_purchase integer not null
);

create table public.tax_rules (
  id uuid primary key default gen_random_uuid(),
  state_code text not null unique,
  rate_percent numeric(6, 3) not null
);

create index products_sku_idx on public.products (sku);
create index products_category_id_idx on public.products (category_id);
create index products_name_trgm_idx on public.products using gin (name gin_trgm_ops);
create index products_name_fts_idx on public.products using gin (to_tsvector('english', name));
create index orders_user_id_idx on public.orders (user_id);
create index orders_status_idx on public.orders (status);
create index cart_items_cart_id_idx on public.cart_items (cart_id);
create index inventory_product_id_idx on public.inventory (product_id);
create index users_clerk_user_id_idx on public.users (clerk_user_id);
