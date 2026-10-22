/** Canonical public site configuration — single source of truth for SEO/GEO URLs. */
export const SITE = {
  name: "Boltfy",
  legalName: "Boltfy",
  tagline: "Free form builder for creators, agencies, and SaaS teams",
  url: "https://boltfy.io",
  defaultDescription:
    "Boltfy is a free form builder for contact forms, lead magnets, and surveys. Drag-and-drop editor, unlimited responses, email campaigns, and real-time analytics — no code required.",
  defaultKeywords:
    "form builder, free form builder, online form creator, drag and drop forms, contact form, lead capture, survey tool, no-code forms, email campaigns, boltfy",
  defaultOgImagePath: "/og-image.png",
  locale: "en_US",
  language: "en",
  supportEmail: "support@boltfy.io",
  twitterHandle: undefined as string | undefined,
} as const;

export function sitePath(path = ""): string {
  if (!path || path === "/") return "/";
  return path.startsWith("/") ? path : `/${path}`;
}

export function absoluteUrl(path = ""): string {
  const normalized = sitePath(path);
  return normalized === "/" ? SITE.url : `${SITE.url}${normalized}`;
}

export function absoluteAssetUrl(assetPath: string): string {
  if (assetPath.startsWith("http://") || assetPath.startsWith("https://")) {
    return assetPath;
  }
  return absoluteUrl(assetPath.startsWith("/") ? assetPath : `/${assetPath}`);
}
