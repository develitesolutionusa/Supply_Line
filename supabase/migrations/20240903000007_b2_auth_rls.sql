create or replace function public.current_app_user()
returns public.users
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.users
  where clerk_user_id = coalesce(
    auth.jwt() ->> 'sub',
    current_setting('request.jwt.claim.sub', true),
    nullif(current_setting('request.jwt.claims', true), '')::json ->> 'sub'
  )
  limit 1
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.current_app_user() u where u.role = 'admin'
  )
$$;

grant execute on function public.current_app_user() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists orders_owner_insert on public.orders;
create policy orders_owner_insert on public.orders
  for insert
  with check (
    user_id = (select id from public.current_app_user())
    or public.is_admin()
  );

drop policy if exists order_items_owner_insert on public.order_items;
create policy order_items_owner_insert on public.order_items
  for insert
  with check (
    exists (
      select 1
      from public.orders o
      where o.id = order_id
        and (
          o.user_id = (select id from public.current_app_user())
          or o.business_account_id = (select business_account_id from public.current_app_user())
          or public.is_admin()
        )
    )
  );

revoke select on table
  public.carts,
  public.cart_items,
  public.orders,
  public.order_items,
  public.addresses,
  public.business_accounts,
  public.users
from anon;
