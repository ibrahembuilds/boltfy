/** Canonical public identity for Boltfy. One host, used by tags, sitemap, and llms.txt. */
export const SITE_NAME = "Boltfy";
export const SITE_ORIGIN = "https://boltfy.io";
export const SITE_EMAIL = "support@boltfy.io";
export const SITE_LOCALE = "en_US";
export const SITE_LANGUAGE = "en";
export const SITE_UPDATED = "2026-10-22";

export const SITE_TITLE = "Boltfy | Free form builder for surveys, leads, and newsletters";

export const SITE_DESCRIPTION =
  "Boltfy is a free form builder. Design forms, share a link or embed, collect responses, manage subscribers, and send email campaigns.";

export const SITE_SUMMARY =
  "Boltfy is a free web form builder for contact forms, surveys, and newsletter signups. You design the form in the browser, share a public link or embed it on another site, collect responses in your account, manage subscribers, and send email campaigns.";

export const SITE_KEYWORDS =
  "Boltfy, form builder, free form builder, online form, survey form, contact form, lead form, newsletter signup, embed form, email campaign";

export const OG_IMAGE_PATH = "/og-image.png";
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;
export const OG_IMAGE_ALT = "Boltfy, a free form builder for surveys, leads, and newsletters";

export const HERO_TITLE = "A free form builder for the responses you actually use";

export function absoluteUrl(path = "/"): string {
  if (!path || path === "/") return `${SITE_ORIGIN}/`;
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${normalized.replace(/\/$/, "")}`;
}

export function absoluteImage(src: string): string {
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  return `${SITE_ORIGIN}${src.startsWith("/") ? src : `/${src}`}`;
}

export function normalizePath(pathname: string): string {
  const pathOnly = pathname.split("?")[0]?.split("#")[0] ?? "/";
  if (pathOnly.length > 1 && pathOnly.endsWith("/")) return pathOnly.slice(0, -1);
  return pathOnly || "/";
}

export function formatLongDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map((part) => Number(part));
  const date = new Date(Date.UTC(year, (month || 1) - 1, day || 1));
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
