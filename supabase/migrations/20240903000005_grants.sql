-- Table grants so RLS policies are actually evaluated for anon/authenticated.
grant usage on schema public to anon, authenticated;

grant select on table public.categories, public.products, public.price_tiers, public.inventory, public.tax_rules, public.warehouses to anon, authenticated;

grant select, insert, update, delete on table public.carts, public.cart_items, public.orders, public.order_items, public.addresses, public.business_accounts, public.users to authenticated;

grant select on table public.carts, public.cart_items, public.orders, public.order_items, public.addresses, public.business_accounts, public.users to anon;
