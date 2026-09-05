import Image from "next/image";
import Link from "next/link";
import { ProductCard } from "@/components/catalog/ProductCard";
import { HeroItems } from "@/components/home/HeroItems";
import { getAccountContext } from "@/lib/auth/context";
import { catalogImage } from "@/lib/catalog/media";
import { listCategories, listProducts } from "@/lib/catalog/query";
import { organizationJsonLd } from "@/lib/seo";
import { fieldClass } from "@/lib/ui";

const VALUE_PROPS = [
  { title: "Wholesale pricing", body: "Case prices drop as volume increases for business accounts." },
  { title: "Bulk discounts", body: "Tiered breaks at 5 and 12 cases, calculated on the server." },
  { title: "Fast restock", body: "Quick order by SKU or repeat a past ticket in a few clicks." },
  { title: "Kitchen-ready quality", body: "Steam pans, takeout, cups, cutlery, gloves, and packaging." },
];

export default async function HomePage() {
  const account = await getAccountContext();
  const [categories, bestSellers] = await Promise.all([
    listCategories(),
    listProducts({ accountTier: account.accountTier, limit: 8, sort: "name" }),
  ]);
  const jsonLd = organizationJsonLd();

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <section className="border-b border-slate-200 bg-slate-100">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-text">
              Foodservice disposables
            </p>
            <h1 className="mt-3 max-w-xl text-4xl font-semibold tracking-tight text-navy sm:text-[2.75rem] sm:leading-tight">
              Everything your foodservice business needs. Delivered.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-slate-600">
              Aluminum pans, takeout containers, cups, cutlery, and packaging — priced by the case
              for restaurants, caterers, and purchasing managers.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/catalog" className={fieldClass.BUTTON}>
                Shop wholesale
              </Link>
              <Link href="/catalog" className={fieldClass.GHOST}>
                Shop retail
              </Link>
            </div>
          </div>
          <HeroItems />
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <ul className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
          {VALUE_PROPS.map((item) => (
            <li key={item.title}>
              <p className="text-sm font-semibold text-navy">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{item.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-navy">Shop by category</h2>
            <p className="mt-1 text-sm text-slate-600">Kitchen staples for restaurants, catering, and takeout.</p>
          </div>
          <Link href="/catalog" className="hidden text-sm font-semibold text-sky-text hover:underline sm:inline">
            View all
          </Link>
        </div>
        <ul className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {categories.map((category) => (
            <li key={category.slug}>
              <Link
                href={`/catalog?category=${category.slug}`}
                className="surface-card card-interactive flex flex-col items-center px-3 py-5 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky"
              >
                <span className="relative h-16 w-16 overflow-hidden rounded-full bg-slate-100">
                  <Image
                    src={catalogImage({ categorySlug: category.slug })}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </span>
                <span className="mt-3 text-sm font-medium text-navy">{category.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl font-semibold text-navy">Best sellers</h2>
            <Link href="/catalog" className="text-sm font-semibold text-sky-text hover:underline">
              Browse catalog
            </Link>
          </div>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {bestSellers.products.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
