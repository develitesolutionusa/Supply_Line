export function PageSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8" aria-hidden>
      <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
      <div className="mt-4 h-10 w-2/3 max-w-md animate-pulse rounded-lg bg-slate-200" />
      <div className="mt-4 h-4 w-full max-w-xl animate-pulse rounded bg-slate-100" />
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-40 animate-pulse rounded-xl border border-slate-200 bg-white" />
        ))}
      </div>
    </div>
  );
}
