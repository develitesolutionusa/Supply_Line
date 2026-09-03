import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);

const raw = env.DATABASE_URL;
if (!raw) {
  console.error("DATABASE_URL is missing");
  process.exit(1);
}

const match = raw.match(/^postgres(?:ql)?:\/\/([^:]+):(.+)@([^:/]+):(\d+)\/(.+)$/);
if (!match) {
  console.error("DATABASE_URL is not a postgres URL");
  process.exit(1);
}

const [, user, password, host, port, database] = match;
const encoded = `postgresql://${user}:${encodeURIComponent(decodeURIComponent(password))}@${host}:${port}/${database}`;
const result = spawnSync(
  "npx",
  ["supabase", "db", "push", "--yes", "--include-all", `--db-url=${encoded}`],
  { stdio: "inherit", shell: true, env: process.env },
);
process.exit(result.status ?? 1);
