type RouteErrorProps = {
  title?: string;
  reset: () => void;
};

export function RouteError({ title = "Something went wrong", reset }: RouteErrorProps) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-text">Error</p>
      <h1 className="mt-2 text-3xl font-semibold text-navy">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">
        This route hit an error boundary. You can retry, or head back to the catalog.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center rounded-lg bg-navy px-5 text-sm font-semibold text-white transition hover:bg-navy-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2"
        >
          Try again
        </button>
        <a
          href="/catalog"
          className="inline-flex h-11 items-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-semibold text-navy hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2"
        >
          Go to catalog
        </a>
      </div>
    </div>
  );
}
