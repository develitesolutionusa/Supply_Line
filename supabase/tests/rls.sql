-- Direct RLS checks against the remote database.
-- Expect: buyer B cannot read buyer A's cart or orders; admin can.

delete from public.cart_items
where cart_id in (
  select id from public.carts
  where user_id in (select id from public.users where clerk_user_id like 'rls_test_%')
);
delete from public.order_items
where order_id in (
  select id from public.orders
  where user_id in (select id from public.users where clerk_user_id like 'rls_test_%')
);
delete from public.orders where user_id in (select id from public.users where clerk_user_id like 'rls_test_%');
delete from public.carts where user_id in (select id from public.users where clerk_user_id like 'rls_test_%');
delete from public.users where clerk_user_id like 'rls_test_%';

insert into public.users (id, clerk_user_id, email, role) values
  ('00000000-0000-0000-0000-00000000aa01', 'rls_test_buyer_a', 'a@rls.test', 'buyer'),
  ('00000000-0000-0000-0000-00000000aa02', 'rls_test_buyer_b', 'b@rls.test', 'buyer'),
  ('00000000-0000-0000-0000-00000000aa03', 'rls_test_admin', 'admin@rls.test', 'admin');

insert into public.carts (id, user_id) values
  ('00000000-0000-0000-0000-00000000cc01', '00000000-0000-0000-0000-00000000aa01');

insert into public.orders (
  id, user_id, status, subtotal_cents, shipping_cents, tax_cents, total_cents, delivery_method
) values (
  '00000000-0000-0000-0000-00000000ee01',
  '00000000-0000-0000-0000-00000000aa01',
  'pending',
  1000, 0, 0, 1000, 'pickup'
);

set role authenticated;
select set_config('request.jwt.claim.sub', 'rls_test_buyer_b', false);

do $$
declare
  cart_rows integer;
  order_rows integer;
begin
  select count(*) into cart_rows from public.carts;
  select count(*) into order_rows from public.orders where id = '00000000-0000-0000-0000-00000000ee01';
  if cart_rows <> 0 then
    raise exception 'buyer B should not see buyer A cart, got % rows', cart_rows;
  end if;
  if order_rows <> 0 then
    raise exception 'buyer B should not see buyer A order, got % rows', order_rows;
  end if;
end $$;

select set_config('request.jwt.claim.sub', 'rls_test_admin', false);

do $$
declare
  cart_rows integer;
begin
  select count(*) into cart_rows
  from public.carts
  where id = '00000000-0000-0000-0000-00000000cc01';
  if cart_rows <> 1 then
    raise exception 'admin should see buyer A cart, got % rows', cart_rows;
  end if;
end $$;

reset role;

delete from public.orders where id = '00000000-0000-0000-0000-00000000ee01';
delete from public.carts where id = '00000000-0000-0000-0000-00000000cc01';
delete from public.users where clerk_user_id like 'rls_test_%';

select 'rls_ok' as result;
