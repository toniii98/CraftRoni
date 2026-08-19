import type { MetadataRoute } from "next";
import prisma from "@/lib/prisma";
import { siteConfig } from "@/lib/config";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url.replace(/\/$/, "");

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/sklep`, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/kategorie`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/o-nas`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/kontakt`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/dostawa`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/zwroty`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${baseUrl}/regulamin`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${baseUrl}/prywatnosc`, changeFrequency: "monthly", priority: 0.3 },
  ];

  try {
    const products = await prisma.product.findMany({
      where: { isActive: true, category: { isActive: true } },
      select: { slug: true, updatedAt: true },
    });

    const productPages: MetadataRoute.Sitemap = products.map((product) => ({
      url: `${baseUrl}/produkt/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "weekly",
      priority: 0.8,
    }));

    return [...staticPages, ...productPages];
  } catch {
    // Baza niedostępna (np. podczas builda) — zwróć strony statyczne
    return staticPages;
  }
}
