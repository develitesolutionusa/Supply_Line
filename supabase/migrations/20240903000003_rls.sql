alter table public.business_accounts enable row level security;
alter table public.users enable row level security;
alter table public.addresses enable row level security;
alter table public.categories enable row level security;
alter table public.warehouses enable row level security;
alter table public.products enable row level security;
alter table public.price_tiers enable row level security;
alter table public.inventory enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.tax_rules enable row level security;

create or replace function public.current_app_user()
returns public.users
language sql
stable
as $$
  select *
  from public.users
  where clerk_user_id = coalesce(auth.jwt() ->> 'sub', current_setting('request.jwt.claim.sub', true))
  limit 1
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.current_app_user() u where u.role = 'admin'
  )
$$;

create policy categories_read on public.categories for select using (true);
create policy products_read on public.products for select using (true);
create policy price_tiers_read on public.price_tiers for select using (true);
create policy inventory_read on public.inventory for select using (true);
create policy tax_rules_read on public.tax_rules for select using (true);
create policy warehouses_read on public.warehouses for select using (true);

create policy categories_admin_write on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy products_admin_write on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy price_tiers_admin_write on public.price_tiers for all using (public.is_admin()) with check (public.is_admin());
create policy inventory_admin_write on public.inventory for all using (public.is_admin()) with check (public.is_admin());
create policy tax_rules_admin_write on public.tax_rules for all using (public.is_admin()) with check (public.is_admin());
create policy warehouses_admin_write on public.warehouses for all using (public.is_admin()) with check (public.is_admin());

create policy carts_owner on public.carts
  for all
  using (user_id = (select id from public.current_app_user()) or public.is_admin())
  with check (user_id = (select id from public.current_app_user()) or public.is_admin());

create policy cart_items_owner on public.cart_items
  for all
  using (
    exists (
      select 1
      from public.carts c
      where c.id = cart_id
        and (c.user_id = (select id from public.current_app_user()) or public.is_admin())
    )
  )
  with check (
    exists (
      select 1
      from public.carts c
      where c.id = cart_id
        and (c.user_id = (select id from public.current_app_user()) or public.is_admin())
    )
  );

create policy orders_owner on public.orders
  for select
  using (
    user_id = (select id from public.current_app_user())
    or business_account_id = (select business_account_id from public.current_app_user())
    or public.is_admin()
  );

create policy order_items_owner on public.order_items
  for select
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (
          o.user_id = (select id from public.current_app_user())
          or o.business_account_id = (select business_account_id from public.current_app_user())
          or public.is_admin()
        )
    )
  );

create policy business_accounts_owner on public.business_accounts
  for select
  using (
    id = (select business_account_id from public.current_app_user())
    or public.is_admin()
  );

create policy business_accounts_owner_update on public.business_accounts
  for update
  using (
    id = (select business_account_id from public.current_app_user())
    or public.is_admin()
  );

create policy addresses_owner on public.addresses
  for all
  using (
    user_id = (select id from public.current_app_user())
    or business_account_id = (select business_account_id from public.current_app_user())
    or public.is_admin()
  )
  with check (
    user_id = (select id from public.current_app_user())
    or business_account_id = (select business_account_id from public.current_app_user())
    or public.is_admin()
  );

create policy users_self on public.users
  for select
  using (id = (select id from public.current_app_user()) or public.is_admin());
