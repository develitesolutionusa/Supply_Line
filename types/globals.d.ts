export {};

declare global {
  interface UserUnsafeMetadata {
    accountType?: "individual" | "business";
  }

  interface UserPublicMetadata {
    role?: "admin" | "buyer" | "staff";
  }

  interface SignUpUnsafeMetadata {
    accountType?: "individual" | "business";
  }
}
