export function PageSkeleton({
  label = "Loading page",
}: {
  label?: string;
}) {
  return (
    <div
      className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
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

export function PanelSkeleton({ label = "Loading" }: { label?: string }) {
  return (
    <div className="space-y-4" role="status" aria-live="polite" aria-busy="true" aria-label={label}>
      <span className="sr-only">{label}</span>
      <div className="h-8 w-64 animate-pulse rounded bg-slate-200" />
      <div className="h-48 animate-pulse rounded-xl border border-slate-200 bg-white" />
      <div className="h-48 animate-pulse rounded-xl border border-slate-200 bg-white" />
    </div>
  );
}
