"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { fieldClass } from "@/lib/ui";

function catalogHref(options: {
  slug?: string;
  search?: string;
  inStock?: boolean;
  sort?: "name" | "price";
}) {
  const params = new URLSearchParams();
  if (options.slug) params.set("category", options.slug);
  if (options.search) params.set("q", options.search);
  if (options.inStock) params.set("stock", "in");
  if (options.sort === "price") params.set("sort", "price");
  const query = params.toString();
  return query ? `/catalog?${query}` : "/catalog";
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={id} className={fieldClass.LABEL}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${fieldClass.INPUT} appearance-auto`}
      >
        {children}
      </select>
    </div>
  );
}

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
    <div className="min-w-0 sm:col-span-2 lg:col-span-1">
      <label htmlFor="catalog-search" className={fieldClass.LABEL}>
        Search
      </label>
      <input
        id="catalog-search"
        type="search"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Name or SKU"
        className={fieldClass.INPUT}
      />
    </div>
  );
}

export function CatalogFilters({
  categories,
  activeSlug,
  search,
  inStock,
  sortBy,
}: {
  categories: { slug: string; name: string }[];
  activeSlug?: string;
  search?: string;
  inStock?: boolean;
  sortBy: "name" | "price";
}) {
  const router = useRouter();
  const hasFilters = Boolean(activeSlug || search || inStock || sortBy === "price");

  function apply(next: {
    slug?: string;
    inStock?: boolean;
    sort?: "name" | "price";
  }) {
    router.push(
      catalogHref({
        slug: next.slug,
        search,
        inStock: next.inStock,
        sort: next.sort,
      }),
    );
  }

  return (
    <div className="mt-5 rounded-md border border-slate-200 bg-white p-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CatalogSearch defaultValue={search ?? ""} />

        <FilterSelect
          id="catalog-category"
          label="Categories"
          value={activeSlug ?? ""}
          onChange={(value) => apply({ slug: value || undefined, inStock, sort: sortBy })}
        >
          <option value="">All products</option>
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.name}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect
          id="catalog-stock"
          label="Availability"
          value={inStock ? "in" : "all"}
          onChange={(value) => apply({ slug: activeSlug, inStock: value === "in", sort: sortBy })}
        >
          <option value="all">All products</option>
          <option value="in">In stock only</option>
        </FilterSelect>

        <FilterSelect
          id="catalog-sort"
          label="Sort"
          value={sortBy}
          onChange={(value) =>
            apply({ slug: activeSlug, inStock, sort: value === "price" ? "price" : "name" })
          }
        >
          <option value="name">Name</option>
          <option value="price">Price</option>
        </FilterSelect>
      </div>

      {hasFilters ? (
        <p className="mt-3 text-sm">
          <Link href="/catalog" className="font-semibold text-sky-text hover:underline">
            Clear filters
          </Link>
        </p>
      ) : null}
    </div>
  );
}
