// src/app/sitemap.ts
import { siteConfig } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const siteUrl = siteConfig.url;

  // Add static routes from your site config
  const routes = ["", "/projects", "/blog", "/docs"].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date().toISOString(),
  }));

  // Add dynamic blog post routes

  return [...routes];
}
