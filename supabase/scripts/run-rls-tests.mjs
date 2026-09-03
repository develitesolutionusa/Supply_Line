import pg from "pg";
import { encodedDatabaseUrl } from "./with-db-url.mjs";

const { url } = encodedDatabaseUrl();
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

await client.connect();
try {
  await client.query("begin");
  await client.query(`
    insert into public.users (id, clerk_user_id, email, role) values
      ('00000000-0000-0000-0000-00000000aa01', 'rls_test_buyer_a', 'a@rls.test', 'buyer'),
      ('00000000-0000-0000-0000-00000000aa02', 'rls_test_buyer_b', 'b@rls.test', 'buyer'),
      ('00000000-0000-0000-0000-00000000aa03', 'rls_test_admin', 'admin@rls.test', 'admin')
    on conflict (id) do update set email = excluded.email, role = excluded.role
  `);
  await client.query(`
    insert into public.carts (id, user_id) values
      ('00000000-0000-0000-0000-00000000cc01', '00000000-0000-0000-0000-00000000aa01')
    on conflict (id) do nothing
  `);
  await client.query(`
    insert into public.orders (
      id, user_id, status, subtotal_cents, shipping_cents, tax_cents, total_cents, delivery_method
    ) values (
      '00000000-0000-0000-0000-00000000ee01',
      '00000000-0000-0000-0000-00000000aa01',
      'pending', 1000, 0, 0, 1000, 'pickup'
    )
    on conflict (id) do nothing
  `);

  await client.query("set local role authenticated");
  await client.query(
    "select set_config('request.jwt.claims', '{\"sub\":\"rls_test_buyer_b\",\"role\":\"authenticated\"}', true)",
  );
  await client.query("select set_config('request.jwt.claim.sub', 'rls_test_buyer_b', true)");
  const buyerCarts = await client.query("select count(*)::int as n from public.carts");
  const buyerOrders = await client.query(
    "select count(*)::int as n from public.orders where id = '00000000-0000-0000-0000-00000000ee01'",
  );
  if (buyerCarts.rows[0].n !== 0) {
    throw new Error(`buyer B should not see buyer A cart, got ${buyerCarts.rows[0].n}`);
  }
  if (buyerOrders.rows[0].n !== 0) {
    throw new Error(`buyer B should not see buyer A order, got ${buyerOrders.rows[0].n}`);
  }

  await client.query(
    "select set_config('request.jwt.claims', '{\"sub\":\"rls_test_admin\",\"role\":\"authenticated\"}', true)",
  );
  await client.query("select set_config('request.jwt.claim.sub', 'rls_test_admin', true)");
  const adminCarts = await client.query(
    "select count(*)::int as n from public.carts where id = '00000000-0000-0000-0000-00000000cc01'",
  );
  if (adminCarts.rows[0].n !== 1) {
    throw new Error(`admin should see buyer A cart, got ${adminCarts.rows[0].n}`);
  }

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
