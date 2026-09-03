import pg from "pg";
import { encodedDatabaseUrl } from "./with-db-url.mjs";

const IDS = {
  userA: "00000000-0000-0000-0000-00000000aa01",
  userB: "00000000-0000-0000-0000-00000000aa02",
  admin: "00000000-0000-0000-0000-00000000aa03",
  accountA: "00000000-0000-0000-0000-00000000bb01",
  accountB: "00000000-0000-0000-0000-00000000bb02",
  cartA: "00000000-0000-0000-0000-00000000cc01",
  orderA: "00000000-0000-0000-0000-00000000ee01",
};

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${expected}, got ${actual}`);
  }
}

async function asJwt(client, clerkUserId) {
  await client.query("set local role authenticated");
  await client.query("select set_config('request.jwt.claim.sub', $1, true)", [clerkUserId]);
  await client.query(
    "select set_config('request.jwt.claims', $1, true)",
    [JSON.stringify({ sub: clerkUserId, role: "authenticated" })],
  );
}

const { url } = encodedDatabaseUrl();
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

await client.connect();
try {
  await client.query("begin");

  await client.query(
    `
    insert into public.business_accounts (id, clerk_org_id, company_name, account_tier)
    values
      ($1, 'rls_org_a', 'RLS Org A', 'business'),
      ($2, 'rls_org_b', 'RLS Org B', 'business')
    on conflict (id) do update set company_name = excluded.company_name
    `,
    [IDS.accountA, IDS.accountB],
  );

  await client.query(
    `
    insert into public.users (id, clerk_user_id, email, role, business_account_id)
    values
      ($1, 'rls_test_buyer_a', 'a@rls.test', 'buyer', $4),
      ($2, 'rls_test_buyer_b', 'b@rls.test', 'buyer', $5),
      ($3, 'rls_test_admin', 'admin@rls.test', 'admin', null)
    on conflict (id) do update
      set email = excluded.email,
          role = excluded.role,
          business_account_id = excluded.business_account_id
    `,
    [IDS.userA, IDS.userB, IDS.admin, IDS.accountA, IDS.accountB],
  );

  await client.query(
    `
    insert into public.carts (id, user_id) values ($1, $2)
    on conflict (id) do nothing
    `,
    [IDS.cartA, IDS.userA],
  );

  await client.query(
    `
    insert into public.orders (
      id, user_id, business_account_id, status, subtotal_cents, shipping_cents, tax_cents, total_cents, delivery_method
    ) values (
      $1, $2, $3, 'pending', 1000, 0, 0, 1000, 'pickup'
    )
    on conflict (id) do nothing
    `,
    [IDS.orderA, IDS.userA, IDS.accountA],
  );

  await asJwt(client, "rls_test_buyer_b");

  const buyerBCarts = await client.query("select count(*)::int as n from public.carts where id = $1", [IDS.cartA]);
  const buyerBOrders = await client.query("select count(*)::int as n from public.orders where id = $1", [IDS.orderA]);
  const buyerBAccounts = await client.query(
    "select count(*)::int as n from public.business_accounts where id = $1",
    [IDS.accountA],
  );
  assertEqual(buyerBCarts.rows[0].n, 0, "buyer B should not see buyer A cart");
  assertEqual(buyerBOrders.rows[0].n, 0, "buyer B should not see buyer A order");
  assertEqual(buyerBAccounts.rows[0].n, 0, "buyer B should not see buyer A business account");

  const cartMutate = await client.query("update public.carts set updated_at = now() where id = $1", [IDS.cartA]);
  const accountMutate = await client.query(
    "update public.business_accounts set company_name = 'hacked' where id = $1",
    [IDS.accountA],
  );
  assertEqual(cartMutate.rowCount, 0, "buyer B should not update buyer A cart");
  assertEqual(accountMutate.rowCount, 0, "buyer B should not update buyer A business account");

  await asJwt(client, "rls_test_buyer_a");
  const buyerACarts = await client.query("select count(*)::int as n from public.carts where id = $1", [IDS.cartA]);
  const buyerAOrders = await client.query("select count(*)::int as n from public.orders where id = $1", [IDS.orderA]);
  assertEqual(buyerACarts.rows[0].n, 1, "buyer A should see own cart");
  assertEqual(buyerAOrders.rows[0].n, 1, "buyer A should see own order");

  await asJwt(client, "rls_test_admin");
  const adminCarts = await client.query("select count(*)::int as n from public.carts where id = $1", [IDS.cartA]);
  const adminOrders = await client.query("select count(*)::int as n from public.orders where id = $1", [IDS.orderA]);
  assertEqual(adminCarts.rows[0].n, 1, "admin should see buyer A cart");
  assertEqual(adminOrders.rows[0].n, 1, "admin should see buyer A order");

  await client.query("rollback");
  console.log(JSON.stringify({ ok: true, result: "rls_ok" }));
} catch (error) {
  try {
    await client.query("rollback");
  } catch {
    /* ignore */
  }
  throw error;
} finally {
  await client.end();
}
