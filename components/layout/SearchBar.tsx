type SearchBarProps = {
  id: string;
  className?: string;
  defaultValue?: string;
};

export function SearchBar({ id, className, defaultValue }: SearchBarProps) {
  return (
    <form action="/catalog" method="get" role="search" className={className}>
      <label htmlFor={id} className="sr-only">
        Search products, categories, or SKU
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400" aria-hidden>
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3-3" strokeLinecap="round" />
          </svg>
        </span>
        <input
          id={id}
          name="q"
          type="search"
          defaultValue={defaultValue}
          placeholder="Search products, categories, or SKU"
          className="h-10 w-full rounded-md border-0 bg-white pl-9 pr-24 text-sm text-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky/40"
        />
        <button
          type="submit"
          className="btn-primary absolute inset-y-1 right-1 rounded-md bg-sky px-3 text-xs font-semibold uppercase tracking-wide text-white hover:bg-sky-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          Search
        </button>
      </div>
    </form>
  );
}
