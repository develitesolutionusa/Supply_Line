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
    const handle = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      if (value.trim()) params.set("q", value.trim());
      else params.delete("q");
      params.delete("page");
      const query = params.toString();
      router.replace(query ? `/catalog?${query}` : "/catalog");
    }, 300);
    return () => window.clearTimeout(handle);
  }, [value, router]);

  return (
    <div>
      <label htmlFor="catalog-search" className="sr-only">
        Filter catalog
      </label>
      <input
        id="catalog-search"
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search name or SKU"
        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-navy placeholder:text-slate-400 focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/40"
      />
    </div>
  );
}

export function CategorySidebar({
  categories,
  activeSlug,
  search,
}: {
  categories: { slug: string; name: string }[];
  activeSlug?: string;
  search?: string;
}) {
  function hrefFor(slug?: string) {
    const params = new URLSearchParams();
    if (slug) params.set("category", slug);
    if (search) params.set("q", search);
    const query = params.toString();
    return query ? `/catalog?${query}` : "/catalog";
  }

  return (
    <nav aria-label="Categories" className="space-y-1">
      <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        Categories
      </p>
      <Link
        href={hrefFor()}
        className={`block rounded-md px-3 py-2 text-sm ${
          !activeSlug ? "bg-navy text-white" : "text-navy hover:bg-slate-100"
        }`}
      >
        All products
      </Link>
      {categories.map((category) => (
        <Link
          key={category.slug}
          href={hrefFor(category.slug)}
          className={`block rounded-md px-3 py-2 text-sm ${
            activeSlug === category.slug ? "bg-navy text-white" : "text-navy hover:bg-slate-100"
          }`}
        >
          {category.name}
        </Link>
      ))}
    </nav>
  );
}
