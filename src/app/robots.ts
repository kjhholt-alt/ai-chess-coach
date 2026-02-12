import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard/settings", "/auth/"],
    },
    sitemap: `${process.env.NEXT_PUBLIC_SITE_URL || "https://aichesscoach.com"}/sitemap.xml`,
  };
}
