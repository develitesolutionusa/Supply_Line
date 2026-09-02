import Link from "next/link";
import { CategorySidebar, CatalogSearch } from "@/components/catalog/CatalogFilters";
import { ProductCard } from "@/components/catalog/ProductCard";
import { getAccountContext } from "@/lib/auth/context";
import { listCategories, listProducts } from "@/lib/catalog/query";

export const metadata = {
  title: "Catalog",
};

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const { q, category, page } = await searchParams;
  const account = await getAccountContext();
  const [categories, result] = await Promise.all([
    listCategories(),
    listProducts({
      category,
      search: q,
      page: Number(page ?? "1"),
      limit: 12,
      accountTier: account.accountTier,
    }),
  ]);

  function pageHref(nextPage: number) {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (q) params.set("q", q);
    if (nextPage > 1) params.set("page", String(nextPage));
    const query = params.toString();
    return query ? `/catalog?${query}` : "/catalog";
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-navy">Catalog</h1>
          <p className="mt-1 text-sm text-slate-600">
            Showing {account.accountTier} pricing
            {account.userId ? "" : " — sign in for business tiers if you have a company org"}.
          </p>
        </div>
        <p className="text-sm text-slate-500">{result.total} products</p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[16rem_1fr]">
        <aside>
          <CatalogSearch defaultValue={q ?? ""} />
          <div className="mt-4">
            <CategorySidebar categories={categories} activeSlug={category} search={q} />
          </div>
        </aside>
        <div>
          {result.products.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <h2 className="text-lg font-semibold text-navy">No products found</h2>
              <p className="mt-2 text-sm text-slate-600">
                Try another keyword or clear the category filter.
              </p>
              <Link href="/catalog" className="mt-4 inline-flex text-sm font-semibold text-sky-dark hover:underline">
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
                <Link href={pageHref(result.page - 1)} className="rounded-md border border-slate-200 px-3 py-2 text-sm">
                  Previous
                </Link>
              ) : null}
              <span className="text-sm text-slate-600">
                Page {result.page} of {result.total_pages}
              </span>
              {result.page < result.total_pages ? (
                <Link href={pageHref(result.page + 1)} className="rounded-md border border-slate-200 px-3 py-2 text-sm">
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
