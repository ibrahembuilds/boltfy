import { blogArticles } from "./blog";
import { blocksToMarkdown } from "./blocks";
import { aboutBlocks, faqs, features } from "./content";
import { articleMarkdown, publicDocuments } from "./documents";
import {
  SITE_EMAIL,
  SITE_NAME,
  SITE_ORIGIN,
  SITE_SUMMARY,
  absoluteUrl,
} from "./site";

const PRIVATE_PREFIXES = [
  "/dashboard",
  "/forms",
  "/settings",
  "/subscribers",
  "/campaigns",
  "/templates",
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
  "/unsubscribe",
  "/f/",
];

export function robotsTxt(): string {
  const disallows = PRIVATE_PREFIXES.map((prefix) => `Disallow: ${prefix}`).join("\n");
  return `# ${SITE_NAME} — ${SITE_ORIGIN}/
# Marketing pages, guides, /llms.txt, and /llms-full.txt are public.
# Googlebot, Bingbot, GPTBot, OAI-SearchBot, ChatGPT-User, PerplexityBot,
# ClaudeBot, anthropic-ai, Google-Extended, and Applebot-Extended may use
# the allowed pages. Account, auth, unsubscribe, and published-form URLs are not for indexing.
# A specific User-agent group replaces "*" rather than merging with it,
# so private routes are listed once, on the default group.

User-agent: *
Allow: /
${disallows}

Sitemap: ${absoluteUrl("/sitemap.xml")}
`;
}

export function sitemapXml(): string {
  const urls = publicDocuments
    .filter((doc) => doc.includeInSitemap)
    .map((doc) => {
      const lastmod = doc.modified ?? doc.published ?? "2026-10-22";
      return `  <url>
    <loc>${absoluteUrl(doc.path)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${doc.changefreq}</changefreq>
    <priority>${doc.priority}</priority>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

export function llmsTxt(): string {
  const guides = blogArticles
    .map((article) => `- [${article.title}](${absoluteUrl(`/blog/${article.slug}`)}): ${article.description}`)
    .join("\n");

  return `# ${SITE_NAME}

> ${SITE_SUMMARY}

${SITE_NAME} does not show a paid plan and does not ask for a credit card to create an account. A published form is available at a public link (\`/f/your-slug\`) or in an iframe with \`?embed=true\`. Accounts are separated with row-level security. Campaign email is sent with Resend when that key is configured. There is no custom domain, Slack, or Zapier connection.

## Product
- [Home](${absoluteUrl("/")}): What ${SITE_NAME} does, how to publish a form, price, and frequently asked questions.
- [About](${absoluteUrl("/about")}): Who the product is for, what it includes, and what it does not do.
- [Contact](${absoluteUrl("/contact")}): Email ${SITE_EMAIL}.

## Guides
${guides}

## Optional
- [Privacy policy](${absoluteUrl("/privacy")}): Account data, form responses, Google sign-in, and the session cookie.
- [Terms of service](${absoluteUrl("/terms")}): Terms for using the website and service.
- [Full text for answer engines](${absoluteUrl("/llms-full.txt")}): The FAQ, about page, and every guide in one Markdown file.
`;
}

export function llmsFullTxt(): string {
  const faq = faqs.map((faq) => `### ${faq.question}\n\n${faq.answer}`).join("\n\n");
  const featureList = features.map((feature) => `- **${feature.title}.** ${feature.description}`).join("\n");
  const guides = blogArticles.map((article) => articleMarkdown(article)).join("\n\n---\n\n");

  return `# ${SITE_NAME}

${SITE_SUMMARY}

Canonical site: ${SITE_ORIGIN}/
Support: ${SITE_EMAIL}

## Facts

${featureList}

- Creating an account does not require a credit card. The app does not show paid tiers.
- Campaign email uses Resend. Without that key, the campaign is stored and not sent.
- There is no custom form domain, Slack connection, Zapier connection, cookie banner, or one-click personal-data export.
- Subscriber rows can be deleted from the Subscribers page and exported to CSV or PDF.

## Frequently asked questions

${faq}

## About

${blocksToMarkdown(aboutBlocks)}

## Guides

${guides}
`;
}
