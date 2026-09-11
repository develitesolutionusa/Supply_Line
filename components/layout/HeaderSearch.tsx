"use client";

import { useEffect, useId, useRef, useState } from "react";

export function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const fieldId = useId();

  useEffect(() => {
    if (!open) return;
    const params = new URLSearchParams(window.location.search);
    const current = window.location.pathname.startsWith("/catalog") ? params.get("q") ?? "" : "";
    setQuery(current);
    const frame = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  if (!open) {
    return (
      <div ref={rootRef}>
        <button
          type="button"
          className="site-header-control inline-flex h-9 w-9 items-center justify-center rounded-md text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky"
          aria-label="Search products, categories, or SKU"
          aria-expanded={false}
          onClick={() => setOpen(true)}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3-3" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="min-w-0 flex-1 sm:flex-none">
      <form
        action="/catalog"
        method="get"
        role="search"
        className="flex h-9 w-full min-w-0 max-w-[18rem] items-center overflow-hidden rounded-md bg-white ring-1 ring-slate-200 sm:w-64 lg:w-72"
        onSubmit={() => setOpen(false)}
      >
        <label htmlFor={fieldId} className="sr-only">
          Search products, categories, or SKU
        </label>
        <input
          ref={inputRef}
          id={fieldId}
          name="q"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search products, categories, or SKU"
          className="min-w-0 flex-1 border-0 bg-transparent px-3 text-sm text-navy placeholder:text-slate-400 focus:outline-none"
        />
        <button
          type="submit"
          className="site-header-signin inline-flex h-full w-9 shrink-0 items-center justify-center bg-sky text-white hover:bg-sky-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-inset"
          aria-label="Search"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3-3" strokeLinecap="round" />
          </svg>
        </button>
      </form>
    </div>
  );
}
