import Link from "next/link";
import { listCategories } from "@/lib/catalog/query";

export default async function HomePage() {
  const categories = await listCategories();

  return (
    <div>
      <section className="bg-navy">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:px-8 lg:py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky">
              Wholesale storefront
            </p>
            <h1 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              Restock by the case. Price by the tier.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-slate-300">
              Browse live catalog pricing for your account type, drop SKUs on a quick-order sheet,
              or repeat a past order. Case prices are always calculated on the server.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/catalog"
                className="inline-flex h-11 items-center rounded-lg bg-sky px-5 text-sm font-semibold text-navy transition hover:bg-sky-dark hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                Browse catalog
              </Link>
              <Link
                href="/quick-order"
                className="inline-flex h-11 items-center rounded-lg border border-white/20 px-5 text-sm font-semibold text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky"
              >
                Quick order
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-200">
            <p className="font-medium text-white">How pricing works</p>
            <ul className="mt-4 space-y-3">
              <li>Business accounts unlock volume tiers as case counts rise.</li>
              <li>Individual accounts see the one-case retail price only.</li>
              <li>The client never sends a price — only product and quantity.</li>
              <li>Stock badges are derived from on-hand quantity vs. threshold.</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-navy">Shop by category</h2>
            <p className="mt-1 text-sm text-slate-600">Trays, containers, cups, cutlery, and more for restaurant kitchens.</p>
          </div>
          <Link href="/catalog" className="hidden text-sm font-semibold text-sky-dark hover:underline sm:inline">
            View all
          </Link>
        </div>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {categories.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/catalog?category=${category.slug}`}
                className="block rounded-xl border border-slate-200 bg-white p-5 transition hover:border-sky hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky"
              >
                <span className="block font-medium text-navy">{category.name}</span>
                <span className="mt-1 block text-xs text-slate-500">{category.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
