import type { MetadataRoute } from "next";
import { listCategories } from "@/lib/catalog/query";
import { siteUrl } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const categories = await listCategories().catch(() => []);
  const now = new Date();

  return [
    { url: base, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/catalog`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/quick-order`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/sign-in`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${base}/sign-up`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    ...categories.map((category) => ({
      url: `${base}/catalog?category=${category.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
