import { useEffect } from "react";
import {
  OG_IMAGE_ALT,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_PATH,
  OG_IMAGE_WIDTH,
  SITE_LANGUAGE,
  SITE_LOCALE,
  SITE_NAME,
  absoluteImage,
  absoluteUrl,
} from "@/seo/site";

interface SEOProps {
  title: string;
  description: string;
  canonicalPath?: string;
  keywords?: string;
  image?: string;
  type?: "website" | "article";
  robots?: string;
  jsonLd?: Record<string, unknown>;
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
}

function upsertMeta(attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function removeMeta(attribute: "name" | "property", key: string) {
  document.head.querySelector(`meta[${attribute}="${key}"]`)?.remove();
}

function upsertLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    if (hreflang) element.setAttribute("hreflang", hreflang);
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
}

export const SEO = ({
  title,
  description,
  canonicalPath,
  keywords = "",
  image = OG_IMAGE_PATH,
  type = "website",
  robots = "index, follow",
  jsonLd,
  publishedTime,
  modifiedTime,
  author = SITE_NAME,
}: SEOProps) => {
  useEffect(() => {
    const path = canonicalPath || `${window.location.pathname}${window.location.search}`;
    const url = absoluteUrl(path.startsWith("/") ? path.split("?")[0] || "/" : "/");
    const imageUrl = absoluteImage(image);
    const usesDefaultImage = image === OG_IMAGE_PATH;

    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("name", "keywords", keywords);
    upsertMeta("name", "author", author);
    upsertMeta("name", "robots", robots);
    upsertMeta("name", "googlebot", robots);
    upsertLink("canonical", url);
    upsertLink("alternate", url, SITE_LANGUAGE);
    upsertLink("alternate", url, "x-default");

    upsertMeta("property", "og:type", type === "article" ? "article" : "website");
    upsertMeta("property", "og:site_name", SITE_NAME);
    upsertMeta("property", "og:locale", SITE_LOCALE);
    upsertMeta("property", "og:url", url);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:image", imageUrl);
    upsertMeta("property", "og:image:alt", usesDefaultImage ? OG_IMAGE_ALT : title);

    if (usesDefaultImage) {
      upsertMeta("property", "og:image:width", String(OG_IMAGE_WIDTH));
      upsertMeta("property", "og:image:height", String(OG_IMAGE_HEIGHT));
    } else {
      removeMeta("property", "og:image:width");
      removeMeta("property", "og:image:height");
    }

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:url", url);
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", imageUrl);
    upsertMeta("name", "twitter:image:alt", usesDefaultImage ? OG_IMAGE_ALT : title);

    if (type === "article" && publishedTime) {
      upsertMeta("property", "article:published_time", publishedTime);
      upsertMeta("property", "article:modified_time", modifiedTime || publishedTime);
      upsertMeta("property", "article:author", author);
    } else {
      removeMeta("property", "article:published_time");
      removeMeta("property", "article:modified_time");
      removeMeta("property", "article:author");
    }

    document.head.querySelectorAll('script[type="application/ld+json"]').forEach((node) => {
      if (node.id !== "seo-jsonld") node.remove();
    });

    const existing = document.getElementById("seo-jsonld");
    if (!jsonLd) {
      existing?.remove();
      return;
    }

    const script = existing instanceof HTMLScriptElement ? existing : document.createElement("script");
    script.id = "seo-jsonld";
    script.type = "application/ld+json";
    script.text = JSON.stringify(jsonLd).replace(/</g, "\\u003c");
    if (!existing) document.head.appendChild(script);
  }, [
    title,
    description,
    canonicalPath,
    keywords,
    image,
    type,
    robots,
    jsonLd,
    publishedTime,
    modifiedTime,
    author,
  ]);

  return null;
};
