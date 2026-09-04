import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const base = process.env.LOAD_TEST_BASE_URL || process.env.LIGHTHOUSE_BASE_URL || "http://localhost:3000";
const pages = ["/", "/catalog", "/sign-up"];

async function probe(path) {
  const response = await fetch(`${base}${path}`, { redirect: "follow" });
  return { path, status: response.status, ok: response.status < 400 };
}

const probes = [];
for (const path of pages) {
  probes.push(await probe(path));
}
const unreachable = probes.filter((row) => !row.ok);
if (unreachable.length) {
  console.log(JSON.stringify({ base, probes, skipped: "lighthouse (pages unreachable)" }, null, 2));
  process.exit(1);
}

const lighthouseMod = await import("lighthouse");
const lighthouse = lighthouseMod.default;
const chromeLauncher = await import("chrome-launcher");

const userDataDir = join(tmpdir(), "supply-line-lh-profile");
mkdirSync(userDataDir, { recursive: true });

const chrome = await chromeLauncher.launch({
  chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  userDataDir,
});

const results = [];
try {
  for (const path of pages) {
    const url = `${base}${path}`;
    const outcome = await lighthouse(url, {
      port: chrome.port,
      output: "json",
      logLevel: "error",
      onlyCategories: ["performance", "accessibility", "seo"],
      preset: "desktop",
    });
    const categories = outcome?.lhr?.categories ?? {};
    results.push({
      path,
      performance: Math.round((categories.performance?.score ?? 0) * 100),
      accessibility: Math.round((categories.accessibility?.score ?? 0) * 100),
      seo: Math.round((categories.seo?.score ?? 0) * 100),
    });
  }
} finally {
  try {
    await chrome.kill();
  } catch {
    /* Windows chrome-launcher temp cleanup can EPERM after a successful run */
  }
}

console.log(JSON.stringify({ base, results }, null, 2));

const failed = results.filter(
  (row) => row.accessibility < 90 || row.seo < 90 || row.performance < 50,
);
if (failed.length) {
  console.error("Lighthouse thresholds not met (a11y/seo >= 90, performance >= 50).");
  process.exit(1);
}
