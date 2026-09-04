export type StorefrontAccountType = "individual" | "business";

export type AccountTypeHints = {
  hasOrganization?: boolean;
};

export function resolveAccountType(value: unknown, hints?: AccountTypeHints): StorefrontAccountType {
  if (hints?.hasOrganization) return "business";
  return value === "business" ? "business" : "individual";
}

export function isBusinessAccountType(value: unknown, hints?: AccountTypeHints) {
  return resolveAccountType(value, hints) === "business";
}
