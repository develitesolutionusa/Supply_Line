import Image from "next/image";
import Link from "next/link";
import { COMPANY, companyAddressLine } from "@/lib/company";
import { fieldClass } from "@/lib/ui";

export const metadata = {
  title: "About us",
  description:
    "SupplyLine is a Dallas-based wholesale desk for foodservice disposables — case-priced pans, takeout, cups, cutlery, and packaging for restaurants and caterers.",
};

const SERVICES = [
  {
    title: "Case-priced catalog",
    body: "Shop aluminum pans, foil, takeout, cups, lids, cutlery, gloves, and packaging with live stock and volume tiers. Business accounts unlock lower case prices at 5- and 12-case breaks. Individual buyers see a clear retail case rate — never a hidden unit price.",
    image: "/images/company/about-services-catalog.png",
    alt: "Studio still life of foodservice pans, cups, takeout containers, and cutlery kits",
  },
  {
    title: "Restock that matches the kitchen",
    body: "Purchasers can browse the catalog, drop SKUs on a quick-order sheet, or reopen a past ticket. Quantities stay in cases. The server recalculates price, tax, and inventory on every cart change so the ticket you send is the ticket you pay.",
    image: "/images/categories/catering-supplies.png",
    alt: "Catering supply pack-out with serving trays and disposable ware",
  },
  {
    title: "Local and expedited delivery",
    body: "Local delivery is a $2 desk-to-door run for same-metro restocks. Expedited delivery is $3 when you need the next freight window. Standard ground still goes free over the published threshold. Pickup is available at the Dallas DC during warehouse hours.",
    image: "/images/company/about-services-delivery.png",
    alt: "Cases of supplies handed off at a restaurant loading dock",
  },
];

const STEPS = [
  { title: "Open an account", body: "Sign up as an individual for retail case pricing, or as a business to create a company organization for shared ordering." },
  { title: "Price by the case", body: "Every product shows pack size, SKU, and live stock. Business volume tiers apply automatically — the cart never trusts a client-sent price." },
  { title: "Check out with confidence", body: "Choose pickup, standard, local, or expedited. Tax follows the ship-to state unless the business account is tax-exempt." },
];

export default function AboutPage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-slate-200">
        <Image
          src="/images/company/about-warehouse.png"
          alt="SupplyLine Dallas distribution floor with staged foodservice cases"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-navy/55" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-28">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-on-navy">About us</p>
          <h1 className="mx-auto mt-3 max-w-3xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            The wholesale desk for kitchens that restock by the case.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-100">
            {COMPANY.name} supplies restaurants, caterers, and purchasing managers from our {COMPANY.warehouse.label}{" "}
            at {companyAddressLine()}. We sell foodservice disposables — not grocery, not retail gadgets — with
            prices and stock calculated on the server every time.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold text-navy">Who we serve</h2>
          <p className="mt-3 text-base leading-7 text-slate-600">
            Independent restaurants, catering shops, and multi-unit buyers who already know their SKUs. You can
            walk the catalog like a store, or punch cases into Quick order the way a GM does on a Sunday night.
            Reorder keeps last ticket quantities and flags anything that changed in price or stock.
          </p>
        </div>
        <dl className="mt-10 grid gap-6 sm:grid-cols-3">
          <div className={`${fieldClass.CARD} p-5`}>
            <dt className="text-sm font-semibold text-navy">Dallas DC</dt>
            <dd className="mt-2 text-sm leading-6 text-slate-600">{companyAddressLine()}</dd>
          </div>
          <div className={`${fieldClass.CARD} p-5`}>
            <dt className="text-sm font-semibold text-navy">Warehouse hours</dt>
            <dd className="mt-2 text-sm leading-6 text-slate-600">{COMPANY.hours}</dd>
          </div>
          <div className={`${fieldClass.CARD} p-5`}>
            <dt className="text-sm font-semibold text-navy">Sales desk</dt>
            <dd className="mt-2 text-sm leading-6 text-slate-600">
              {COMPANY.phone}
              <br />
              {COMPANY.email}
            </dd>
          </div>
        </dl>
      </section>

      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold text-navy">Services</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Everything on this site is built around case quantities, live inventory, and account-aware pricing.
          </p>
          <ul className="mt-10 grid gap-8 lg:grid-cols-3">
            {SERVICES.map((service) => (
              <li key={service.title} className={`${fieldClass.CARD} overflow-hidden`}>
                <div className="relative aspect-[4/3]">
                  <Image
                    src={service.image}
                    alt={service.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 360px"
                    className="object-cover"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-navy">{service.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{service.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-semibold text-navy">How an order moves</h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className={`${fieldClass.CARD} p-5`}>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sky-text">Step {index + 1}</p>
              <h3 className="mt-2 text-base font-semibold text-navy">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{step.body}</p>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/catalog" className={fieldClass.BUTTON}>
            Browse the catalog
          </Link>
          <Link href="/contact" className={fieldClass.GHOST}>
            Talk to the desk
          </Link>
        </div>
      </section>
    </div>
  );
}
