import Link from "next/link";
import { FOOTER_ACCOUNT_LINKS, FOOTER_SHOP_LINKS, SITE_NAME } from "@/lib/nav";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
        <div>
          <p className="text-lg font-semibold text-navy">{SITE_NAME}</p>
          <p className="mt-2 max-w-xs text-sm leading-6 text-muted">
            Case-priced wholesale for restaurants, offices, and retail operators.
            Prices, tax, and stock always come from the server.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Shop</p>
          <ul className="mt-3 space-y-2">
            {FOOTER_SHOP_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-navy hover:text-sky-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Account</p>
          <ul className="mt-3 space-y-2">
            {FOOTER_ACCOUNT_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-navy hover:text-sky-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-200">
        <p className="mx-auto max-w-7xl px-4 py-4 text-xs text-slate-500 sm:px-6 lg:px-8">
          © {new Date().getFullYear()} {SITE_NAME}.
        </p>
      </div>
    </footer>
  );
}
