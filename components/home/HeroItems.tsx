import Image from "next/image";

export function HeroItems() {
  return (
    <div className="relative aspect-[5/3] overflow-hidden rounded-md border border-slate-200 bg-white shadow-[0_1px_2px_rgb(15_23_42_/_0.04)]">
      <Image
        src="/images/hero-foodservice-supplies.png"
        alt="Empty foodservice supply items: aluminum steam pans, foil, kraft bags, hot cups, lids, deli containers, takeout boxes, and cutlery"
        fill
        priority
        sizes="(max-width: 1024px) 100vw, 560px"
        className="object-cover object-center"
      />
    </div>
  );
}
