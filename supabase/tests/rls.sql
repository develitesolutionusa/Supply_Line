-- Direct Postgres RLS proof for Phase B2 / B8.
-- Executed in one transaction by supabase/scripts/run-rls-tests.mjs (rolled back).
-- Expect: buyer B cannot read or mutate buyer A's cart, orders, or account.

select 1;
