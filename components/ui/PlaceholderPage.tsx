import Link from "next/link";

type PlaceholderPageProps = {
  kicker?: string;
  title: string;
  description: string;
  phaseNote: string;
};

export function PlaceholderPage({
  kicker = "Placeholder",
  title,
  description,
  phaseNote,
}: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-text">{kicker}</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">{title}</h1>
      <p className="mt-4 text-base leading-7 text-slate-600">{description}</p>
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600">
        {phaseNote}
      </div>
      <Link
        href="/catalog"
        className="mt-8 inline-flex h-11 items-center rounded-lg bg-navy px-5 text-sm font-semibold text-white transition hover:bg-navy-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2"
      >
        Back to catalog
      </Link>
    </div>
  );
}
