import { MetadataRoute } from "next";
import { db } from "@/lib/db";
import { env } from "@/lib/env";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  let exams: { slug: string; updatedAt: Date }[] = [];
  let schemes: { slug: string; updatedAt: Date }[] = [];

  try {
    const [e, s] = await Promise.all([
      db.exam.findMany({
        where: { isPublished: true, isArchived: false },
        select: { slug: true, updatedAt: true },
      }),
      db.scheme.findMany({
        where: { isPublished: true, isArchived: false },
        select: { slug: true, updatedAt: true },
      }),
    ]);
    exams = e;
    schemes = s;
  } catch (error) {
    console.warn("[SITEMAP] Database not available during sitemap generation:", error);
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/exams`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/schemes`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/upcoming`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/closing-soon`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  const examRoutes: MetadataRoute.Sitemap = exams.map((e) => ({
    url: `${baseUrl}/exams/${e.slug}`,
    lastModified: e.updatedAt,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const schemeRoutes: MetadataRoute.Sitemap = schemes.map((s) => ({
    url: `${baseUrl}/schemes/${s.slug}`,
    lastModified: s.updatedAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...examRoutes, ...schemeRoutes];
}
