import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-text">404</p>
      <h1 className="mt-2 text-3xl font-semibold text-navy">Page not found</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        That URL is not part of the storefront skeleton. Try the catalog or head home.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-lg bg-navy px-5 text-sm font-semibold text-white hover:bg-navy-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2"
        >
          Home
        </Link>
        <Link
          href="/catalog"
          className="inline-flex h-11 items-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-navy hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2"
        >
          Catalog
        </Link>
      </div>
    </div>
  );
}
