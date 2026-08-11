import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = siteConfig.url.replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api", "/koszyk", "/zamowienie", "/konto"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
