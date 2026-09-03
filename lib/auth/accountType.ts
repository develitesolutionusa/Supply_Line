export type StorefrontAccountType = "individual" | "business";

export function resolveAccountType(value: unknown): StorefrontAccountType {
  return value === "business" ? "business" : "individual";
}

export function isBusinessAccountType(value: unknown) {
  return resolveAccountType(value) === "business";
}
