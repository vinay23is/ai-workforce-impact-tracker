import type { MetadataRoute } from "next";
import { loadDataset } from "@/lib/data";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const dataset = loadDataset();
  const lastModified = new Date(dataset.meta.lastDatasetUpdate);

  const staticRoutes = [
    "",
    "/events",
    "/companies",
    "/industries",
    "/map",
    "/ai-investment",
    "/methodology",
    "/corrections",
    "/resources",
    "/data",
  ].map((path) => ({ url: `${base}${path}`, lastModified }));

  const eventRoutes = dataset.events
    .filter((e) => e.published)
    .map((e) => ({ url: `${base}/events/${e.slug}`, lastModified }));

  const companyRoutes = dataset.companies.map((c) => ({
    url: `${base}/companies/${c.slug}`,
    lastModified,
  }));

  const industryRoutes = dataset.industries.map((i) => ({
    url: `${base}/industries/${i.slug}`,
    lastModified,
  }));

  return [...staticRoutes, ...eventRoutes, ...companyRoutes, ...industryRoutes];
}
