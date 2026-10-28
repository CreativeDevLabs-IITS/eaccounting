import type { MetadataRoute } from "next";
import { site } from "@/lib/site";

// Required for `output: "export"`: emit this file at build time.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: site.url, changeFrequency: "monthly", priority: 1 }];
}
