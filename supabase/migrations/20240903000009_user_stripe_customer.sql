alter table public.users
  add column if not exists stripe_customer_id text;
