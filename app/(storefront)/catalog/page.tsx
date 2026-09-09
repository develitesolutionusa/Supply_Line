import Link from "next/link";
import { CatalogFilters } from "@/components/catalog/CatalogFilters";
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

      <CatalogFilters
        categories={categories}
        activeSlug={category}
        search={q}
        inStock={inStock}
        sortBy={sortBy}
      />

      {result.products.length === 0 ? (
        <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-white p-10 text-center">
          <h2 className="text-lg font-semibold text-navy">No products found</h2>
          <p className="mt-2 text-sm text-slate-600">
            Try another keyword or clear the category filter.
          </p>
          <Link href="/catalog" className="mt-4 inline-flex text-sm font-semibold text-sky-text hover:underline">
            Reset catalog
          </Link>
        </div>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
  );
}
