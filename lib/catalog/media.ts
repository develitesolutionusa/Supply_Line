export const HERO_IMAGE = "/images/hero-foodservice-supplies.png";

function productImagePath(sku: string) {
  return `/images/products/${sku.toUpperCase()}.png`;
}

function categoryImagePath(slug: string) {
  return `/images/categories/${slug}.png`;
}

const PRODUCT_SKUS = new Set([
  "ALU-HALF-100",
  "ALU-FOIL-18",
  "ALU-LID-100",
  "PLS-DELI-32",
  "PLS-CUP-2",
  "PLS-HNG-9",
  "PAP-NAP-8",
  "PAP-TWL-6",
  "PAP-DELI-10",
  "CUP-HOT-16",
  "CUP-CLD-24",
  "CUP-LID-16",
  "OUT-CLAM-200",
  "OUT-BOX-250",
  "OUT-NDL-200",
  "CAT-CHF-4",
  "CAT-SRV-50",
  "CAT-PLT-25",
  "CUT-FRK-1000",
  "CUT-KNF-1000",
  "CUT-KIT-250",
  "CLN-DEG-4",
  "CLN-SAN-4",
  "CLN-FLR-5",
  "GLV-NIT-10",
  "GLV-PLY-10",
  "GLV-APR-100",
  "BAG-TSH-500",
  "BAG-LNR-100",
  "BAG-FLM-4",
]);

const CATEGORY_SLUGS = new Set([
  "aluminum-trays-foil",
  "plastic-containers",
  "paper-products",
  "cups-lids",
  "takeout-containers",
  "catering-supplies",
  "disposable-cutlery",
  "cleaning-supplies",
  "gloves-safety",
  "bags-packaging",
]);

export function catalogImage(options: {
  imageUrl?: string | null;
  categorySlug?: string | null;
  sku?: string | null;
}) {
  if (options.imageUrl) return options.imageUrl;
  const sku = options.sku?.toUpperCase() ?? "";
  if (sku && PRODUCT_SKUS.has(sku)) return productImagePath(sku);
  const slug = options.categorySlug ?? "";
  if (slug && CATEGORY_SLUGS.has(slug)) return categoryImagePath(slug);
  return HERO_IMAGE;
}
