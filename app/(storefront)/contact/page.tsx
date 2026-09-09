import Image from "next/image";
import { ContactForm } from "@/components/company/ContactForm";
import { COMPANY, companyAddressLine } from "@/lib/company";
import { siteUrl } from "@/lib/seo";
import { fieldClass } from "@/lib/ui";

export const metadata = {
  title: "Contact us",
  description:
    "Reach the SupplyLine sales desk for wholesale accounts, catalog questions, and delivery from the Dallas DC.",
};

export default function ContactPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: COMPANY.name,
    url: siteUrl(),
    email: COMPANY.email,
    telephone: COMPANY.phone,
    address: {
      "@type": "PostalAddress",
      streetAddress: COMPANY.warehouse.line1,
      addressLocality: COMPANY.warehouse.city,
      addressRegion: COMPANY.warehouse.state,
      postalCode: COMPANY.warehouse.zip,
      addressCountry: "US",
    },
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="relative overflow-hidden border-b border-slate-200">
        <Image
          src="/images/company/contact-office.png"
          alt="SupplyLine sales conversation over a case-order sheet"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-navy/50" />
        <div className="relative mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-20">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-on-navy">Contact us</p>
          <h1 className="mx-auto mt-3 max-w-2xl text-4xl font-semibold tracking-tight text-white">
            Talk to the wholesale desk.
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-slate-100">
            New business accounts, delivery windows, and catalog questions go through the same team that
            stages cases at {COMPANY.warehouse.label}.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-16">
        <div>
          <h2 className="text-xl font-semibold text-navy">Dallas DC</h2>
          <div className="mt-4 grid gap-4">
            <div className={`${fieldClass.CARD} p-5`}>
              <p className="text-sm font-semibold text-navy">{COMPANY.warehouse.label}</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{companyAddressLine()}</p>
            </div>
            <div className={`${fieldClass.CARD} p-5`}>
              <p className="text-sm font-semibold text-navy">Hours</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">{COMPANY.hours}</p>
            </div>
            <a
              className={`${fieldClass.CARD} block p-5 focus-visible:outline-none`}
              href={`tel:+12145550140`}
            >
              <p className="text-sm font-semibold text-navy">Phone</p>
              <p className="mt-2 text-sm leading-6 text-sky-text">{COMPANY.phone}</p>
            </a>
            <a
              className={`${fieldClass.CARD} block p-5 focus-visible:outline-none`}
              href={`mailto:${COMPANY.email}`}
            >
              <p className="text-sm font-semibold text-navy">Email</p>
              <p className="mt-2 text-sm leading-6 text-sky-text">{COMPANY.email}</p>
            </a>
          </div>
          <p className="mt-8 text-sm leading-6 text-slate-600">
            For live case pricing, open a business account and order from the catalog. This form reaches
            operations — it does not change cart totals or place an order.
          </p>
        </div>
        <div className="surface-card p-6">
          <h2 className="text-lg font-semibold text-navy">Send a message</h2>
          <p className="mt-1 text-sm text-slate-600">We reply during warehouse hours, usually the same business day.</p>
          <div className="mt-6">
            <ContactForm />
          </div>
        </div>
      </section>
    </div>
  );
}
