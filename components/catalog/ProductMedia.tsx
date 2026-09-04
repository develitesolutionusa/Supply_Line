import Image from "next/image";
import { catalogImage } from "@/lib/catalog/media";

export function ProductMedia({
  name,
  sku,
  imageUrl,
  categorySlug,
  priority = false,
  className = "",
}: {
  name: string;
  sku: string;
  imageUrl?: string | null;
  categorySlug?: string | null;
  priority?: boolean;
  className?: string;
}) {
  const src = catalogImage({ imageUrl, categorySlug, sku });

  return (
    <div className={`relative aspect-[4/3] w-full overflow-hidden rounded-md bg-slate-100 ${className}`}>
      <Image
        src={src}
        alt={name}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
        className="object-cover"
        priority={priority}
      />
    </div>
  );
}
