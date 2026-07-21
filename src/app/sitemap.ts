import type { MetadataRoute } from "next";

const SITE_URL = "https://thepastrypicasso.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const routes: { path: string; priority: number }[] = [
    { path: "", priority: 1 },
    { path: "/menu", priority: 0.9 },
    { path: "/order", priority: 0.8 },
    { path: "/gallery", priority: 0.7 },
    { path: "/about", priority: 0.6 },
    { path: "/contact", priority: 0.6 },
    { path: "/favorites", priority: 0.4 },
    { path: "/account", priority: 0.3 },
  ];

  return routes.map((r) => ({
    url: `${SITE_URL}${r.path}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: r.priority,
  }));
}
