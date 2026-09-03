import { spawnSync } from "node:child_process";
import { readFileSync, unlinkSync, writeFileSync } from "node:fs";

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
const sqlPath = "D:\\temp\\check-extensions.sql";
writeFileSync(
  sqlPath,
  "select extname from pg_extension where extname in ('pg_trgm','uuid-ossp','pgcrypto') order by extname;\n",
);

const result = spawnSync("npx", ["supabase", "db", "query", `--db-url=${encoded}`, "--file", sqlPath], {
  encoding: "utf8",
  shell: true,
});

try {
  unlinkSync(sqlPath);
} catch {
  /* ignore */
}

if (result.status !== 0) {
  process.stderr.write(result.stderr || result.stdout || "query failed\n");
  process.exit(result.status ?? 1);
}

const names = [...(result.stdout.matchAll(/pg_trgm|uuid-ossp|pgcrypto/g) ?? [])].map((item) => item[0]);
const unique = [...new Set(names)];
console.log(
  JSON.stringify({
    host,
    extensions: unique,
    ready: ["pg_trgm", "uuid-ossp", "pgcrypto"].every((name) => unique.includes(name)),
  }),
);
