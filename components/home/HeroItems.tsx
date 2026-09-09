import Image from "next/image";

export function HeroItems() {
  return (
    <div className="hero-visual card-interactive relative aspect-[16/9] overflow-hidden rounded-md border border-slate-200 bg-white shadow-[0_1px_2px_rgb(15_23_42_/_0.04)]">
      <Image
        src="/images/hero-foodservice-premium.png"
        alt="Premium foodservice case goods on a steel prep table: aluminum steam pans, foil, kraft bags, hot cups, lids, takeout containers, and cutlery"
        fill
        priority
        sizes="(max-width: 1024px) 100vw, 560px"
        className="hero-visual-image object-cover object-center"
      />
    </div>
  );
}
