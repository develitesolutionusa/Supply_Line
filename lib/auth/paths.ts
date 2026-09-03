export const PROTECTED_PATH_PREFIXES = [
  "/checkout",
  "/account",
  "/admin",
  "/create-organization",
] as const;

export function isProtectedPath(pathname: string) {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
