import { blogArticles, type BlogArticle } from "./blog";
import { blocksToMarkdown } from "./blocks";
import { aboutBlocks, faqs, features, pricingFeatures, steps, useCases } from "./content";
import { blocksToHtml, escapeHtml, pageShell } from "./html";
import { breadcrumbNode, faqNode, graph, organizationNode, webPageNode, websiteNode } from "./schema";
import {
  HERO_TITLE,
  OG_IMAGE_PATH,
  SITE_DESCRIPTION,
  SITE_EMAIL,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_ORIGIN,
  SITE_SUMMARY,
  SITE_TITLE,
  SITE_UPDATED,
  absoluteImage,
  absoluteUrl,
  formatLongDate,
  normalizePath,
} from "./site";
import type { SeoDocument } from "./types";

function softwareNode(): Record<string, unknown> {
  return {
    "@type": "SoftwareApplication",
    "@id": `${SITE_ORIGIN}/#app`,
    name: SITE_NAME,
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Form builder",
    operatingSystem: "Web",
    url: absoluteUrl("/"),
    description: SITE_SUMMARY,
    image: absoluteImage(OG_IMAGE_PATH),
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free to create an account and publish forms. No paid tier is shown in the app.",
    },
    featureList: features.map((feature) => feature.title),
    publisher: { "@id": `${SITE_ORIGIN}/#organization` },
  };
}

function homeSnapshot(): string {
  const featureList = features
    .map((feature) => `<li><strong>${escapeHtml(feature.title)}.</strong> ${escapeHtml(feature.description)}</li>`)
    .join("");
  const stepList = steps
    .map((step, index) => `<li><strong>${index + 1}. ${escapeHtml(step.title)}.</strong> ${escapeHtml(step.description)}</li>`)
    .join("");
  const priceList = pricingFeatures.map((item) => `<li>${escapeHtml(item)}</li>`).join("");
  const faqHtml = faqs
    .map((faq) => `<h3>${escapeHtml(faq.question)}</h3><p>${escapeHtml(faq.answer)}</p>`)
    .join("");
  const useCaseHtml = useCases
    .map((useCase) => `<li><strong>${escapeHtml(useCase.title)}.</strong> ${escapeHtml(useCase.description)}</li>`)
    .join("");

  return pageShell(
    HERO_TITLE,
    `<p>${escapeHtml(SITE_SUMMARY)}</p>
     <p><a href="${absoluteUrl("/signup")}">Create a free account</a></p>
     <h2>What Boltfy does</h2><ul>${featureList}</ul>
     <h2>How to publish a form</h2><ol>${stepList}</ol>
     <h2>Price</h2>
     <p>Boltfy does not show a paid plan and does not ask for a credit card to create an account. Campaign email is sent through Resend when that service is configured.</p>
     <ul>${priceList}</ul>
     <h2>Ways people use it</h2><ul>${useCaseHtml}</ul>
     <h2>Frequently asked questions</h2>${faqHtml}`,
  );
}

function articleDocument(article: BlogArticle): SeoDocument {
  const path = `/blog/${article.slug}`;
  const url = absoluteUrl(path);
  return {
    path,
    title: `${article.title} | ${SITE_NAME}`,
    description: article.description,
    keywords: `${article.category}, form builder, ${SITE_NAME}`,
    robots: "index, follow, max-image-preview:large, max-snippet:-1",
    image: article.image,
    type: "article",
    published: article.published,
    modified: article.modified,
    author: article.author,
    changefreq: "monthly",
    priority: "0.7",
    includeInSitemap: true,
    jsonLd: graph([
      organizationNode(),
      {
        "@type": "BlogPosting",
        "@id": `${url}#article`,
        headline: article.title,
        description: article.description,
        datePublished: article.published,
        dateModified: article.modified,
        author: { "@type": "Person", name: article.author },
        publisher: { "@id": `${SITE_ORIGIN}/#organization` },
        image: absoluteImage(article.image),
        mainEntityOfPage: url,
        articleSection: article.category,
        inLanguage: "en",
        url,
      },
      breadcrumbNode([
        { name: "Home", path: "/" },
        { name: "Blog", path: "/blog" },
        { name: article.title, path },
      ]),
    ]),
    snapshotHtml: pageShell(
      article.title,
      `<p>${escapeHtml(article.description)}</p>
       <p>By ${escapeHtml(article.author)} · ${escapeHtml(formatLongDate(article.published))} · Updated ${escapeHtml(formatLongDate(article.modified))} · ${escapeHtml(article.readTime)} read</p>
       ${blocksToHtml(article.sections)}
       <p><a href="${absoluteUrl("/blog")}">All Boltfy guides</a></p>`,
    ),
  };
}

const staticDocuments: SeoDocument[] = [
  {
    path: "/",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    keywords: SITE_KEYWORDS,
    robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    image: OG_IMAGE_PATH,
    type: "website",
    modified: SITE_UPDATED,
    changefreq: "weekly",
    priority: "1.0",
    includeInSitemap: true,
    jsonLd: graph([
      organizationNode(),
      websiteNode(),
      softwareNode(),
      faqNode(faqs),
      breadcrumbNode([{ name: "Home", path: "/" }]),
    ]),
    snapshotHtml: homeSnapshot(),
  },
  {
    path: "/about",
    title: `About ${SITE_NAME} | Free form builder`,
    description: SITE_DESCRIPTION,
    keywords: SITE_KEYWORDS,
    robots: "index, follow, max-image-preview:large, max-snippet:-1",
    image: OG_IMAGE_PATH,
    type: "website",
    modified: SITE_UPDATED,
    changefreq: "monthly",
    priority: "0.6",
    includeInSitemap: true,
    jsonLd: graph([
      organizationNode(),
      websiteNode(),
      webPageNode("/about", `About ${SITE_NAME}`, SITE_DESCRIPTION),
      breadcrumbNode([
        { name: "Home", path: "/" },
        { name: "About", path: "/about" },
      ]),
    ]),
    snapshotHtml: pageShell(`About ${SITE_NAME}`, blocksToHtml(aboutBlocks)),
  },
  {
    path: "/blog",
    title: `Guides | ${SITE_NAME}`,
    description:
      "Practical guides from Boltfy on finishing more forms, collecting leads without code, and designing a form people can read.",
    keywords: `Boltfy blog, form design, lead capture, ${SITE_KEYWORDS}`,
    robots: "index, follow, max-image-preview:large, max-snippet:-1",
    image: OG_IMAGE_PATH,
    type: "website",
    modified: SITE_UPDATED,
    changefreq: "weekly",
    priority: "0.8",
    includeInSitemap: true,
    jsonLd: graph([
      organizationNode(),
      websiteNode(),
      {
        "@type": "Blog",
        "@id": `${absoluteUrl("/blog")}#blog`,
        name: `${SITE_NAME} guides`,
        url: absoluteUrl("/blog"),
        description:
          "Guides on form completion, no-code lead collection, and form design.",
        publisher: { "@id": `${SITE_ORIGIN}/#organization` },
        blogPost: blogArticles.map((article) => ({
          "@id": `${absoluteUrl(`/blog/${article.slug}`)}#article`,
        })),
      },
      {
        "@type": "ItemList",
        itemListElement: blogArticles.map((article, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: absoluteUrl(`/blog/${article.slug}`),
          name: article.title,
        })),
      },
      breadcrumbNode([
        { name: "Home", path: "/" },
        { name: "Blog", path: "/blog" },
      ]),
    ]),
    snapshotHtml: pageShell(
      "Guides on forms, leads, and design",
      `<p>Practical guides on finishing more forms, collecting leads without a custom backend, and designing a form people can read.</p>
       <ul>${blogArticles
         .map(
           (article) =>
             `<li><a href="${absoluteUrl(`/blog/${article.slug}`)}"><strong>${escapeHtml(article.title)}</strong></a> — ${escapeHtml(article.description)}</li>`,
         )
         .join("")}</ul>`,
    ),
  },
  {
    path: "/contact",
    title: `Contact ${SITE_NAME}`,
    description: `Contact Boltfy support at ${SITE_EMAIL}. Send a message about your account, a published form, or email delivery.`,
    keywords: `contact Boltfy, ${SITE_EMAIL}, form builder support`,
    robots: "index, follow, max-image-preview:large, max-snippet:-1",
    image: OG_IMAGE_PATH,
    type: "website",
    modified: SITE_UPDATED,
    changefreq: "monthly",
    priority: "0.6",
    includeInSitemap: true,
    jsonLd: graph([
      organizationNode(),
      websiteNode(),
      {
        "@type": "ContactPage",
        "@id": `${absoluteUrl("/contact")}#webpage`,
        url: absoluteUrl("/contact"),
        name: `Contact ${SITE_NAME}`,
        description: `Email ${SITE_EMAIL} or send the contact form.`,
        isPartOf: { "@id": `${SITE_ORIGIN}/#website` },
        mainEntity: { "@id": `${SITE_ORIGIN}/#organization` },
      },
      breadcrumbNode([
        { name: "Home", path: "/" },
        { name: "Contact", path: "/contact" },
      ]),
    ]),
    snapshotHtml: pageShell(
      `Contact ${SITE_NAME}`,
      `<p>Email <a href="mailto:${SITE_EMAIL}">${SITE_EMAIL}</a> or use the form on this page. Include your account email and the form link if the question is about a published form.</p>
       <p>Boltfy does not publish an office address or a live chat. Support replies by email. The message is delivered through the same email function as the rest of the product, to ${SITE_EMAIL}, with your address as the reply-to.</p>`,
    ),
  },
  {
    path: "/privacy",
    title: `Privacy policy | ${SITE_NAME}`,
    description:
      "How Boltfy handles account data, form responses, Google sign-in, and the session cookie. Contact support@boltfy.io with privacy questions.",
    keywords: "Boltfy privacy policy, form data, account data",
    robots: "index, follow",
    image: OG_IMAGE_PATH,
    type: "website",
    modified: "2024-12-30",
    changefreq: "yearly",
    priority: "0.3",
    includeInSitemap: true,
    jsonLd: graph([
      organizationNode(),
      webPageNode(
        "/privacy",
        "Privacy policy",
        "How Boltfy handles account data, form responses, and support requests.",
      ),
      breadcrumbNode([
        { name: "Home", path: "/" },
        { name: "Privacy", path: "/privacy" },
      ]),
    ]),
    snapshotHtml: pageShell(
      "Privacy Policy",
      `<p>Last updated December 30, 2024.</p>
       <p>The privacy policy explains what Boltfy collects when you create an account or a form, how Google sign-in is used, that the site keeps a session cookie so you stay signed in, and that privacy questions go to <a href="mailto:${SITE_EMAIL}">${SITE_EMAIL}</a>.</p>
       <p>The full text of the policy is on this page.</p>`,
    ),
  },
  {
    path: "/terms",
    title: `Terms of service | ${SITE_NAME}`,
    description: "The terms for using the Boltfy website and form builder.",
    keywords: "Boltfy terms of service",
    robots: "index, follow",
    image: OG_IMAGE_PATH,
    type: "website",
    modified: "2025-12-28",
    changefreq: "yearly",
    priority: "0.3",
    includeInSitemap: true,
    jsonLd: graph([
      organizationNode(),
      webPageNode("/terms", "Terms of service", "The terms for using Boltfy."),
      breadcrumbNode([
        { name: "Home", path: "/" },
        { name: "Terms", path: "/terms" },
      ]),
    ]),
    snapshotHtml: pageShell(
      "Terms of Service",
      `<p>Last updated December 28, 2025.</p>
       <p>These terms cover use of the Boltfy website and service, the license to view the materials, and the disclaimer. The full text is on this page.</p>`,
    ),
  },
];

export const publicDocuments: SeoDocument[] = [
  ...staticDocuments,
  ...blogArticles.map(articleDocument),
];

const privateTitles: { prefix: string; title: string }[] = [
  { prefix: "/dashboard", title: "Dashboard" },
  { prefix: "/forms", title: "Forms" },
  { prefix: "/settings", title: "Settings" },
  { prefix: "/subscribers", title: "Subscribers" },
  { prefix: "/campaigns", title: "Campaigns" },
  { prefix: "/templates", title: "Templates" },
  { prefix: "/login", title: "Log in" },
  { prefix: "/signup", title: "Sign up" },
  { prefix: "/forgot-password", title: "Forgot password" },
  { prefix: "/reset-password", title: "Reset password" },
  { prefix: "/unsubscribe", title: "Unsubscribe" },
];

function privateDocument(path: string, title: string): SeoDocument {
  return {
    path,
    title: `${title} | ${SITE_NAME}`,
    description: "Boltfy account page.",
    keywords: SITE_KEYWORDS,
    robots: "noindex, nofollow",
    image: OG_IMAGE_PATH,
    type: "website",
    changefreq: "yearly",
    priority: "0.0",
    includeInSitemap: false,
    jsonLd: { "@context": "https://schema.org", "@type": "WebPage", name: title, url: absoluteUrl(path) },
    snapshotHtml: "",
  };
}

export function resolveDocument(pathname: string): SeoDocument {
  const path = normalizePath(pathname);
  const published = publicDocuments.find((doc) => doc.path === path);
  if (published) return published;

  if (path.startsWith("/f/")) {
    return privateDocument(path, "Form");
  }

  const privateMatch = privateTitles.find((entry) => path === entry.prefix || path.startsWith(`${entry.prefix}/`));
  if (privateMatch) return privateDocument(path, privateMatch.title);

  return privateDocument(path, "Page not found");
}

export function articleMarkdown(article: BlogArticle): string {
  return `# ${article.title}\n\n${article.description}\n\nBy ${article.author}. Published ${article.published}. Updated ${article.modified}.\n\n${blocksToMarkdown(article.sections)}\n\nCanonical URL: ${absoluteUrl(`/blog/${article.slug}`)}`;
}
