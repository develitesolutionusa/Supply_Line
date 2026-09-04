import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { SITE_DESCRIPTION, siteUrl } from "../lib/seo";

describe("F8 SEO helpers", () => {
  it("exposes a crawlable site description and default origin", () => {
    assert.match(SITE_DESCRIPTION, /wholesale/i);
    assert.equal(siteUrl(), process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
  });
});

describe("F8 contrast tokens", () => {
  it("defines a text sky color that meets AA on white", () => {
    const css = readFileSync(resolve("app/globals.css"), "utf8");
    assert.match(css, /--color-sky-text:\s*#1d4ed8/);
    assert.match(css, /prefers-reduced-motion/);
    assert.match(css, /100dvh/);
  });
});
