const base = (process.env.LOAD_TEST_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
const concurrency = Number(process.env.LOAD_TEST_CONCURRENCY || 12);
const requests = Number(process.env.LOAD_TEST_REQUESTS || 48);

const targets = [
  { name: "catalog-search", path: "/api/products?search=cup&page=1&limit=12" },
  { name: "admin-metrics", path: "/api/admin/metrics" },
];

async function timeOne(path) {
  const started = performance.now();
  try {
    const response = await fetch(`${base}${path}`);
    return { ok: response.status < 500, status: response.status, ms: performance.now() - started };
  } catch {
    return { ok: false, status: 0, ms: performance.now() - started };
  }
}

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[index];
}

async function runTarget(target) {
  const results = [];
  let next = 0;
  async function worker() {
    while (next < requests) {
      const index = next;
      next += 1;
      results[index] = await timeOne(target.path);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, requests) }, () => worker()));
  const times = results.map((item) => item.ms);
  const failures = results.filter((item) => !item.ok).length;
  return {
    name: target.name,
    path: target.path,
    requests: results.length,
    failures,
    p50_ms: Math.round(percentile(times, 50)),
    p95_ms: Math.round(percentile(times, 95)),
    statuses: Object.fromEntries(
      [...new Set(results.map((item) => item.status))].map((status) => [
        status,
        results.filter((item) => item.status === status).length,
      ]),
    ),
  };
}

const reports = [];
for (const target of targets) {
  reports.push(await runTarget(target));
}

console.log(JSON.stringify({ base, concurrency, requests, reports }, null, 2));

const broken = reports.filter((report) => report.failures > 0);
if (broken.length) {
  console.error("Load test recorded 5xx/network failures.");
  process.exit(1);
}
