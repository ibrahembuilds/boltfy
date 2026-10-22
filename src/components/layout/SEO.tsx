import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  SITE,
  absoluteAssetUrl,
  absoluteUrl,
  sitePath,
} from "@/lib/site";

type RobotsDirective = "index, follow" | "noindex, nofollow" | "noindex, follow";

interface SEOProps {
  title: string;
  description?: string;
  keywords?: string;
  /** Path only, e.g. `/blog/my-post` — canonical and og:url are derived from SITE.url */
  path?: string;
  image?: string;
  type?: "website" | "article";
  robots?: RobotsDirective;
  /** Article Open Graph (blog posts) */
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    section?: string;
  };
  /** One or more JSON-LD objects injected into `<head>` */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** Append brand suffix to document title */
  titleTemplate?: boolean;
}

const JSON_LD_ID = "boltfy-json-ld";

function upsertMeta(
  selector: string,
  create: () => HTMLElement,
  content: string,
  attr: "name" | "property" = "name",
  attrValue?: string,
) {
  let el = document.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = create() as HTMLMetaElement;
    document.head.appendChild(el);
  }
  if (attrValue) el.setAttribute(attr, attrValue);
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

function setJsonLd(blocks: Record<string, unknown>[]) {
  let script = document.getElementById(JSON_LD_ID) as HTMLScriptElement | null;
  if (!blocks.length) {
    script?.remove();
    return;
  }
  if (!script) {
    script = document.createElement("script");
    script.id = JSON_LD_ID;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(
    blocks.length === 1 ? blocks[0] : blocks,
  );
}

export const SEO = ({
  title,
  description = SITE.defaultDescription,
  keywords = SITE.defaultKeywords,
  path,
  image = SITE.defaultOgImagePath,
  type = "website",
  robots = "index, follow",
  article,
  jsonLd,
  titleTemplate = true,
}: SEOProps) => {
  const location = useLocation();
  const resolvedPath = sitePath(path ?? location.pathname);
  const pageUrl = absoluteUrl(resolvedPath);
  const imageUrl = absoluteAssetUrl(image);

  const jsonLdBlocks = useMemo(() => {
    if (!jsonLd) return [];
    return Array.isArray(jsonLd) ? jsonLd : [jsonLd];
  }, [jsonLd]);

  useEffect(() => {
    const fullTitle = titleTemplate
      ? `${title} | ${SITE.name}`
      : title;
    document.title = fullTitle;
    document.documentElement.lang = SITE.language;

    upsertMeta('meta[name="description"]', () => {
      const m = document.createElement("meta");
      m.setAttribute("name", "description");
      return m;
    }, description);

    upsertMeta('meta[name="keywords"]', () => {
      const m = document.createElement("meta");
      m.setAttribute("name", "keywords");
      return m;
    }, keywords);

    upsertMeta('meta[name="robots"]', () => {
      const m = document.createElement("meta");
      m.setAttribute("name", "robots");
      return m;
    }, robots);

    upsertMeta('meta[property="og:title"]', () => {
      const m = document.createElement("meta");
      m.setAttribute("property", "og:title");
      return m;
    }, title);

    upsertMeta('meta[property="og:description"]', () => {
      const m = document.createElement("meta");
      m.setAttribute("property", "og:description");
      return m;
    }, description);

    upsertMeta('meta[property="og:image"]', () => {
      const m = document.createElement("meta");
      m.setAttribute("property", "og:image");
      return m;
    }, imageUrl);

    upsertMeta('meta[property="og:url"]', () => {
      const m = document.createElement("meta");
      m.setAttribute("property", "og:url");
      return m;
    }, pageUrl);

    upsertMeta('meta[property="og:type"]', () => {
      const m = document.createElement("meta");
      m.setAttribute("property", "og:type");
      return m;
    }, type);

    upsertMeta('meta[property="og:site_name"]', () => {
      const m = document.createElement("meta");
      m.setAttribute("property", "og:site_name");
      return m;
    }, SITE.name);

    upsertMeta('meta[property="og:locale"]', () => {
      const m = document.createElement("meta");
      m.setAttribute("property", "og:locale");
      return m;
    }, SITE.locale);

    upsertMeta('meta[name="twitter:card"]', () => {
      const m = document.createElement("meta");
      m.setAttribute("name", "twitter:card");
      return m;
    }, "summary_large_image");

    upsertMeta('meta[name="twitter:title"]', () => {
      const m = document.createElement("meta");
      m.setAttribute("name", "twitter:title");
      return m;
    }, title);

    upsertMeta('meta[name="twitter:description"]', () => {
      const m = document.createElement("meta");
      m.setAttribute("name", "twitter:description");
      return m;
    }, description);

    upsertMeta('meta[name="twitter:image"]', () => {
      const m = document.createElement("meta");
      m.setAttribute("name", "twitter:image");
      return m;
    }, imageUrl);

    if (SITE.twitterHandle) {
      upsertMeta('meta[name="twitter:site"]', () => {
        const m = document.createElement("meta");
        m.setAttribute("name", "twitter:site");
        return m;
      }, SITE.twitterHandle);
    }

    if (type === "article" && article?.publishedTime) {
      upsertMeta('meta[property="article:published_time"]', () => {
        const m = document.createElement("meta");
        m.setAttribute("property", "article:published_time");
        return m;
      }, article.publishedTime);
      if (article.modifiedTime) {
        upsertMeta('meta[property="article:modified_time"]', () => {
          const m = document.createElement("meta");
          m.setAttribute("property", "article:modified_time");
          return m;
        }, article.modifiedTime);
      }
      if (article.author) {
        upsertMeta('meta[property="article:author"]', () => {
          const m = document.createElement("meta");
          m.setAttribute("property", "article:author");
          return m;
        }, article.author);
      }
      if (article.section) {
        upsertMeta('meta[property="article:section"]', () => {
          const m = document.createElement("meta");
          m.setAttribute("property", "article:section");
          return m;
        }, article.section);
      }
    }

    upsertLink("canonical", pageUrl);
    setJsonLd(jsonLdBlocks);

    return () => {
      setJsonLd([]);
    };
  }, [
    title,
    description,
    keywords,
    imageUrl,
    pageUrl,
    type,
    robots,
    article?.publishedTime,
    article?.modifiedTime,
    article?.author,
    article?.section,
    jsonLdBlocks,
    titleTemplate,
  ]);

  return null;
};

/** SEO for auth and app screens that should not appear in search results. */
export const NoIndexSEO = ({ title }: { title: string }) => (
  <SEO
    title={title}
    robots="noindex, nofollow"
    titleTemplate={false}
  />
);
