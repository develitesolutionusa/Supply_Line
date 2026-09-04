export type StorefrontAccountType = "individual" | "business";

export function resolveAccountType(
  value: unknown,
  extras?: { hasOrganization?: boolean },
): StorefrontAccountType {
  if (extras?.hasOrganization || value === "business") return "business";
  return "individual";
}

export function isBusinessAccountType(value: unknown, extras?: { hasOrganization?: boolean }) {
  return resolveAccountType(value, extras) === "business";
}
