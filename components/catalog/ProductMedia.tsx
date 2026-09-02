export function ProductMedia({
  name,
  sku,
  imageUrl,
}: {
  name: string;
  sku: string;
  imageUrl?: string | null;
}) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name}
        className="aspect-[4/3] w-full rounded-lg object-cover"
      />
    );
  }

  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className="flex aspect-[4/3] items-center justify-center rounded-lg bg-gradient-to-br from-navy to-navy-muted text-sky"
      aria-hidden
    >
      <div className="text-center">
        <p className="text-3xl font-semibold tracking-tight">{initials}</p>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-slate-300">{sku}</p>
      </div>
    </div>
  );
}
