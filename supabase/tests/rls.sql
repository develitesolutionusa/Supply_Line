-- Run against a linked Supabase project after `supabase db reset`.
-- Expect: a buyer JWT cannot read another account's carts/orders.

-- Placeholder assertions documented for Phase B2 / B8.
-- 1. Insert two users with distinct clerk_user_id values.
-- 2. Insert a cart owned by user A.
-- 3. SET request.jwt.claim.sub = user B clerk id; SELECT from carts; expect 0 rows.
-- 4. Admin role user can SELECT all carts.
select 1;
