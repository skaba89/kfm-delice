import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://kfmdelice.sn";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/kitchen/", "/driver/", "/api/", "/order/"],
      },
    ],
    sitemap: `${appUrl}/sitemap.xml`,
  };
}
