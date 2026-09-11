import Link from "next/link";
import { Logo } from "@/components/layout/Logo";
import { SocialIcons } from "@/components/layout/SocialIcons";
import { COMPANY, companyAddressLine } from "@/lib/company";
import { FOOTER_ACCOUNT_LINKS, FOOTER_COMPANY_LINKS, FOOTER_SHOP_LINKS } from "@/lib/nav";

function FooterLinks({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-on-navy">{title}</p>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="site-footer-link">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Footer() {
  return (
    <footer className="site-footer mt-auto">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        <div>
          <Logo appearance="dark" />
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-300">
            Case-priced foodservice disposables for restaurants, caterers, and purchasing managers.
          </p>
          <address className="mt-5 not-italic text-sm leading-6 text-slate-300">
            <p className="font-semibold text-white">{COMPANY.warehouse.label}</p>
            <p>{companyAddressLine()}</p>
            <p className="mt-2">{COMPANY.hours}</p>
            <p className="mt-2">
              <a className="site-footer-link" href="tel:+12145550140">
                {COMPANY.phone}
              </a>
            </p>
            <p>
              <a className="site-footer-link" href={`mailto:${COMPANY.email}`}>
                {COMPANY.email}
              </a>
            </p>
          </address>
          <SocialIcons className="mt-5" />
        </div>
        <FooterLinks title="Shop" links={FOOTER_SHOP_LINKS} />
        <FooterLinks title="Company" links={FOOTER_COMPANY_LINKS} />
        <FooterLinks title="Account" links={FOOTER_ACCOUNT_LINKS} />
      </div>
    </footer>
  );
}
