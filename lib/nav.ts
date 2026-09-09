export const SITE_NAME = "SupplyLine";
export const SITE_TAGLINE = "Wholesale";

export const NAV_LINKS = [
  { href: "/catalog", label: "Catalog" },
  { href: "/quick-order", label: "Quick order" },
  { href: "/reorder", label: "Reorder" },
  { href: "/about", label: "About us" },
  { href: "/contact", label: "Contact us" },
] as const;

export const ADMIN_NAV_LINK = { href: "/admin", label: "Admin" } as const;

export const FOOTER_SHOP_LINKS = [
  { href: "/catalog", label: "Catalog" },
  { href: "/quick-order", label: "Quick order" },
  { href: "/reorder", label: "Reorder" },
  { href: "/cart", label: "Cart" },
] as const;

export const FOOTER_COMPANY_LINKS = [
  { href: "/about", label: "About us" },
  { href: "/contact", label: "Contact us" },
] as const;

export const FOOTER_ACCOUNT_LINKS = [
  { href: "/sign-in", label: "Sign in" },
  { href: "/account", label: "Account" },
  { href: "/account/orders", label: "My orders" },
  { href: "/checkout", label: "Checkout" },
] as const;
