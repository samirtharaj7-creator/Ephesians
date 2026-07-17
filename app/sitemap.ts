import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://ephesians.mybibleexplorer.com";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/background/`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/articles/`, changeFrequency: "weekly", priority: 0.7 }
  ];

  const chapters: MetadataRoute.Sitemap = Array.from({ length: 6 }, (_, index) => ({
    url: `${siteUrl}/ephesians/${index + 1}/`,
    changeFrequency: "monthly",
    priority: 0.9
  }));

  return [...pages, ...chapters];
}
