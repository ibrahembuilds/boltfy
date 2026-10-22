export interface SeoDocument {
  path: string;
  title: string;
  description: string;
  keywords: string;
  robots: string;
  image: string;
  type: "website" | "article";
  jsonLd: Record<string, unknown>;
  snapshotHtml: string;
  published?: string;
  modified?: string;
  author?: string;
  changefreq: "weekly" | "monthly" | "yearly";
  priority: string;
  includeInSitemap: boolean;
}
