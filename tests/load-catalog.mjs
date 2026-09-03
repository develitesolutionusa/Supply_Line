const base = process.env.LOAD_TEST_URL || "http://localhost:3000";
const rounds = Number(process.env.LOAD_TEST_ROUNDS || 25);

async function hit(path) {
  const started = Date.now();
  const response = await fetch(`${base}${path}`);
  return { path, status: response.status, ms: Date.now() - started };
}

const paths = ["/api/categories", "/api/products?limit=12", "/api/admin/metrics"];
const results = [];

for (let i = 0; i < rounds; i += 1) {
  for (const path of paths) {
    results.push(await hit(path));
  }
}

const byPath = Object.fromEntries(
  paths.map((path) => {
    const rows = results.filter((row) => row.path === path);
    const ok = rows.filter((row) => row.status < 500).length;
    const avg = Math.round(rows.reduce((sum, row) => sum + row.ms, 0) / rows.length);
    return [path, { requests: rows.length, non_5xx: ok, avg_ms: avg }];
  }),
);

console.log(JSON.stringify({ base, rounds, byPath }, null, 2));
const failed = results.filter((row) => row.status >= 500);
if (failed.length) {
  process.exit(1);
}
