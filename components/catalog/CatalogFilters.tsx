"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function CatalogSearch({ defaultValue }: { defaultValue: string }) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    if (value === defaultValue) return;
    const handle = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (value.trim()) params.set("q", value.trim());
      else params.delete("q");
      params.delete("page");
      const query = params.toString();
      router.replace(query ? `/catalog?${query}` : "/catalog");
    }, 300);
    return () => window.clearTimeout(handle);
  }, [value, defaultValue, router]);

  return (
    <div>
      <label htmlFor="catalog-search" className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Search name or SKU
      </label>
      <input
        id="catalog-search"
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="ALU-FOIL-18"
        className="mt-2 h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-navy placeholder:text-slate-400 focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/30"
      />
    </div>
  );
}

export function CategorySidebar({
  categories,
  activeSlug,
  search,
  inStock,
}: {
  categories: { slug: string; name: string }[];
  activeSlug?: string;
  search?: string;
  inStock?: boolean;
}) {
  const router = useRouter();

  function hrefFor(slug?: string, stock?: boolean) {
    const params = new URLSearchParams();
    if (slug) params.set("category", slug);
    if (search) params.set("q", search);
    if (stock) params.set("stock", "in");
    const query = params.toString();
    return query ? `/catalog?${query}` : "/catalog";
  }

  return (
    <div className="rounded-md border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgb(15_23_42_/_0.04)]">
      <CatalogSearch defaultValue={search ?? ""} />
      <label className="mt-4 flex items-center gap-2 text-sm text-navy">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 text-sky focus:ring-sky"
          checked={Boolean(inStock)}
          onChange={() => {
            router.push(hrefFor(activeSlug, !inStock));
          }}
        />
        In stock only
      </label>
      <nav aria-label="Categories" className="mt-5 space-y-0.5">
        <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Categories</p>
        <Link
          href={hrefFor(undefined, inStock)}
          className={`block rounded-md px-3 py-2 text-sm ${
            !activeSlug ? "bg-sky text-white" : "text-navy hover:bg-slate-50"
          }`}
        >
          All products
        </Link>
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={hrefFor(category.slug, inStock)}
            className={`block rounded-md px-3 py-2 text-sm ${
              activeSlug === category.slug ? "bg-sky text-white" : "text-navy hover:bg-slate-50"
            }`}
          >
            {category.name}
          </Link>
        ))}
      </nav>
    </div>
  );
}
