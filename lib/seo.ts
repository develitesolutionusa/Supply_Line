import { SITE_NAME } from "@/lib/nav";

export const SITE_DESCRIPTION =
  "Case-priced foodservice disposables for restaurants, caterers, and purchasing managers. Wholesale case prices, tax, and stock are always calculated on the server.";

export function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: siteUrl(),
    description: SITE_DESCRIPTION,
  };
}
