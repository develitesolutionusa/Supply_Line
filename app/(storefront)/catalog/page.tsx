import Link from "next/link";
import { CategorySidebar } from "@/components/catalog/CatalogFilters";
import { ProductCard } from "@/components/catalog/ProductCard";
import { getAccountContext } from "@/lib/auth/context";
import { listCategories, listProducts } from "@/lib/catalog/query";
import { fieldClass } from "@/lib/ui";

export const metadata = {
  title: "Catalog",
  description: "Browse case-priced foodservice disposables by category, SKU, or keyword.",
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string; stock?: string; sort?: string }>;
}) {
  const { q, category, page, stock, sort } = await searchParams;
  const inStock = stock === "in";
  const sortBy = sort === "price" ? "price" : "name";
  const account = await getAccountContext();
  const [categories, result] = await Promise.all([
    listCategories(),
    listProducts({
      category,
      search: q,
      page: Number(page ?? "1"),
      limit: 12,
      accountTier: account.accountTier,
      inStock,
      sort: sortBy,
    }),
  ]);

  function pageHref(nextPage: number) {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (q) params.set("q", q);
    if (inStock) params.set("stock", "in");
    if (sortBy === "price") params.set("sort", "price");
    if (nextPage > 1) params.set("page", String(nextPage));
    const query = params.toString();
    return query ? `/catalog?${query}` : "/catalog";
  }

  function sortHref(nextSort: "name" | "price") {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (q) params.set("q", q);
    if (inStock) params.set("stock", "in");
    if (nextSort === "price") params.set("sort", "price");
    const query = params.toString();
    return query ? `/catalog?${query}` : "/catalog";
  }

  const pricingLabel =
    account.accountTier === "business" ? "Showing business pricing." : "Showing retail pricing.";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-navy sm:text-3xl">Catalog</h1>
          <p className="mt-1 text-sm text-slate-600">{pricingLabel}</p>
        </div>
        <p className="text-sm text-slate-500">
          {result.total} product{result.total === 1 ? "" : "s"}
        </p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[16.5rem_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <CategorySidebar
            categories={categories}
            activeSlug={category}
            search={q}
            inStock={inStock}
          />
        </aside>
        <div>
          <div className="mb-4 flex flex-wrap items-center justify-end gap-2 text-sm">
            <span className="text-slate-500">Sort</span>
            <Link
              href={sortHref("name")}
              className={`rounded-md px-3 py-1.5 ${sortBy === "name" ? "bg-navy text-white" : "border border-slate-200 bg-white text-navy"}`}
            >
              Name
            </Link>
            <Link
              href={sortHref("price")}
              className={`rounded-md px-3 py-1.5 ${sortBy === "price" ? "bg-navy text-white" : "border border-slate-200 bg-white text-navy"}`}
            >
              Price
            </Link>
          </div>
          {result.products.length === 0 ? (
            <div className="rounded-md border border-dashed border-slate-300 bg-white p-10 text-center">
              <h2 className="text-lg font-semibold text-navy">No products found</h2>
              <p className="mt-2 text-sm text-slate-600">
                Try another keyword or clear the category filter.
              </p>
              <Link href="/catalog" className="mt-4 inline-flex text-sm font-semibold text-sky-text hover:underline">
                Reset catalog
              </Link>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {result.products.map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} />
                </li>
              ))}
            </ul>
          )}
          {result.total_pages > 1 ? (
            <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Pagination">
              {result.page > 1 ? (
                <Link href={pageHref(result.page - 1)} className={`rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ${fieldClass.RING}`}>
                  Previous
                </Link>
              ) : null}
              <span className="text-sm text-slate-600">
                Page {result.page} of {result.total_pages}
              </span>
              {result.page < result.total_pages ? (
                <Link href={pageHref(result.page + 1)} className={`rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ${fieldClass.RING}`}>
                  Next
                </Link>
              ) : null}
            </nav>
          ) : null}
        </div>
      </div>
    </div>
  );
}
