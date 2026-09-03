export const PROTECTED_PAGE_PREFIXES = [
  "/checkout",
  "/account",
  "/admin",
  "/create-organization",
] as const;

export const PROTECTED_API_PREFIXES = [
  "/api/cart",
  "/api/checkout",
  "/api/orders",
  "/api/account",
  "/api/admin",
  "/api/quick-order",
] as const;

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isProtectedApiPath(pathname: string) {
  return PROTECTED_API_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

export function isProtectedPath(pathname: string) {
  return (
    PROTECTED_PAGE_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix)) ||
    isProtectedApiPath(pathname)
  );
}
