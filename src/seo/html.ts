import type { Block } from "./blocks";
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
} from "./site";
import type { SeoDocument } from "./types";

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function blocksToHtml(blocks: Block[]): string {
  return blocks
    .map((block) => {
      switch (block.type) {
        case "h2":
          return `<h2>${escapeHtml(block.text)}</h2>`;
        case "h3":
          return `<h3>${escapeHtml(block.text)}</h3>`;
        case "p":
          return `<p>${escapeHtml(block.text)}</p>`;
        case "ul":
          return `<ul>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
        case "quote":
          return `<blockquote>${escapeHtml(block.text)}</blockquote>`;
        default:
          return "";
      }
    })
    .join("\n");
}

export function pageShell(title: string, body: string): string {
  const links = [
    ["/", "Home"],
    ["/about", "About"],
    ["/blog", "Blog"],
    ["/contact", "Contact"],
    ["/privacy", "Privacy"],
    ["/terms", "Terms"],
  ]
    .map(([path, label]) => `<a href="${absoluteUrl(path)}">${label}</a>`)
    .join(" · ");

  return `<article><h1>${escapeHtml(title)}</h1>${body}<nav aria-label="Site">${links}</nav></article>`;
}

function jsonLdScript(data: Record<string, unknown>): string {
  const json = JSON.stringify(data).replace(/</g, "\\u003c");
  return `<script type="application/ld+json" id="seo-jsonld">${json}</script>`;
}

export function renderHead(doc: SeoDocument): string {
  const url = absoluteUrl(doc.path);
  const image = absoluteImage(doc.image);
  const imageIsOg = doc.image === OG_IMAGE_PATH;
  const imageSize = imageIsOg
    ? `\n    <meta property="og:image:width" content="${OG_IMAGE_WIDTH}" />\n    <meta property="og:image:height" content="${OG_IMAGE_HEIGHT}" />`
    : "";
  const articleMeta =
    doc.type === "article"
      ? `\n    <meta property="article:published_time" content="${escapeHtml(doc.published ?? "")}" />\n    <meta property="article:modified_time" content="${escapeHtml(doc.modified ?? "")}" />\n    <meta property="article:author" content="${escapeHtml(doc.author ?? SITE_NAME)}" />`
      : "";

  return `    <title>${escapeHtml(doc.title)}</title>
    <meta name="description" content="${escapeHtml(doc.description)}" />
    <meta name="keywords" content="${escapeHtml(doc.keywords)}" />
    <meta name="author" content="${escapeHtml(doc.author ?? SITE_NAME)}" />
    <meta name="robots" content="${escapeHtml(doc.robots)}" />
    <meta name="googlebot" content="${escapeHtml(doc.robots)}" />
    <link rel="canonical" href="${url}" />
    <link rel="alternate" hrefLang="${SITE_LANGUAGE}" href="${url}" />
    <link rel="alternate" hrefLang="x-default" href="${url}" />
    <meta property="og:type" content="${doc.type === "article" ? "article" : "website"}" />
    <meta property="og:site_name" content="${SITE_NAME}" />
    <meta property="og:locale" content="${SITE_LOCALE}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:title" content="${escapeHtml(doc.title)}" />
    <meta property="og:description" content="${escapeHtml(doc.description)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:image:alt" content="${escapeHtml(imageIsOg ? OG_IMAGE_ALT : doc.title)}" />${imageSize}${articleMeta}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:url" content="${url}" />
    <meta name="twitter:title" content="${escapeHtml(doc.title)}" />
    <meta name="twitter:description" content="${escapeHtml(doc.description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
    <meta name="twitter:image:alt" content="${escapeHtml(imageIsOg ? OG_IMAGE_ALT : doc.title)}" />
    ${jsonLdScript(doc.jsonLd)}`;
}

const PRERENDER_STYLE = `#seo-prerender{box-sizing:border-box;max-width:42rem;margin:2rem auto;padding:0 1.25rem 3rem;color:#1e293b;font-family:Georgia,"Iowan Old Style",serif;line-height:1.6}#seo-prerender h1{font-size:2rem;line-height:1.2;margin:0 0 1rem}#seo-prerender h2{font-size:1.35rem;margin:1.75rem 0 .5rem}#seo-prerender p,#seo-prerender li{font-size:1.05rem}#seo-prerender a{color:#4338ca}#seo-prerender nav{margin-top:2rem;font-family:Inter,system-ui,sans-serif;font-size:.95rem}`;

export function renderSnapshot(doc: SeoDocument): string {
  return `<div id="seo-prerender"><style>${PRERENDER_STYLE}</style>${doc.snapshotHtml}</div>\n    <script>var prerender=document.getElementById("seo-prerender");if(prerender)prerender.remove();</script>`;
}

export function applySeoTemplate(template: string, doc: SeoDocument): string {
  if (!template.includes("<!-- seo:start -->") || !template.includes("<!-- seo:end -->")) {
    throw new Error("index.html is missing seo:start / seo:end markers");
  }

  const withHead = template.replace(
    /<!-- seo:start -->[\s\S]*?<!-- seo:end -->/,
    `<!-- seo:start -->\n${renderHead(doc)}\n    <!-- seo:end -->`,
  );

  const snapshot = renderSnapshot(doc);
  if (withHead.includes('id="seo-prerender"')) return withHead;
  return withHead.replace('<div id="root"></div>', `${snapshot}\n    <div id="root"></div>`);
}
