export default function ProductLoading() {
  return (
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8" aria-hidden>
      <div className="aspect-[4/3] animate-pulse rounded-lg bg-slate-200" />
      <div className="space-y-4">
        <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
        <div className="h-10 w-2/3 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
      </div>
    </div>
  );
}
