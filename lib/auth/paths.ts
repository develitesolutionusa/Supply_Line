export const PROTECTED_PATH_PREFIXES = [
  "/checkout",
  "/account",
  "/admin",
  "/create-organization",
] as const;

const PUBLIC_API_PREFIXES = ["/api/products", "/api/categories", "/api/webhooks/"];

export function isProtectedPath(pathname: string) {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isProtectedApiRequest(pathname: string, method: string) {
  if (!pathname.startsWith("/api/")) return false;
  if (PUBLIC_API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix))) {
    return method !== "GET" && method !== "HEAD" && method !== "OPTIONS";
  }
  return true;
}
