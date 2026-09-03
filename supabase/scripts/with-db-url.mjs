import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";

export function encodedDatabaseUrl() {
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
  if (!raw) throw new Error("DATABASE_URL is missing");
  const match = raw.match(/^postgres(?:ql)?:\/\/([^:]+):(.+)@([^:/]+):(\d+)\/(.+)$/);
  if (!match) throw new Error("DATABASE_URL is not a postgres URL");
  const [, user, password, host, port, database] = match;
  return {
    host,
    url: `postgresql://${user}:${encodeURIComponent(decodeURIComponent(password))}@${host}:${port}/${database}`,
  };
}

export function queryFile(sqlPath) {
  const { url } = encodedDatabaseUrl();
  const result = spawnSync("npx", ["supabase", "db", "query", `--db-url=${url}`, "--file", sqlPath], {
    encoding: "utf8",
    shell: true,
  });
  if (result.status !== 0) {
    throw new Error((result.stderr || "") + (result.stdout || "") || "query failed");
  }
  return `${result.stdout || ""}\n${result.stderr || ""}`;
}

export function querySql(sql) {
  const sqlPath = "D:\\temp\\supply-line-query.sql";
  writeFileSync(sqlPath, sql);
  try {
    return queryFile(sqlPath);
  } finally {
    try {
      unlinkSync(sqlPath);
    } catch {
      /* ignore */
    }
  }
}
