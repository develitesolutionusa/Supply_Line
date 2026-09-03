const DEFAULT_ADMIN_EMAILS = ["husbantech08@gmail.com"];

function parseEmailList(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
}

export function adminEmailAllowlist() {
  const fromEnv = [
    ...parseEmailList(process.env.NEXT_PUBLIC_ADMIN_EMAILS),
    ...parseEmailList(process.env.ADMIN_EMAILS),
  ];
  const unique = [...new Set(fromEnv)];
  return unique.length > 0 ? unique : DEFAULT_ADMIN_EMAILS;
}

export function isAdminLoginEmail(
  email: string | null | undefined,
  allowlist: string[] = adminEmailAllowlist(),
) {
  if (!email) return false;
  return allowlist.includes(email.trim().toLowerCase());
}

export function hasAdminLoginEmail(
  emails: Array<string | null | undefined>,
  allowlist: string[] = adminEmailAllowlist(),
) {
  return emails.some((email) => isAdminLoginEmail(email, allowlist));
}
