import fs from "node:fs";
import path from "node:path";

const dist = path.resolve("dist");

function read(relative) {
  const file = path.join(dist, relative);
  if (!fs.existsSync(file)) {
    throw new Error(`Missing ${relative}`);
  }
  return fs.readFileSync(file, "utf8");
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const robots = read("robots.txt");
const sitemap = read("sitemap.xml");
const llms = read("llms.txt");
const llmsFull = read("llms-full.txt");
const home = read("index.html");
const blog = read("blog/index.html");
const about = read("about/index.html");
const contact = read("contact/index.html");
const guideA = read("blog/best-form-builder-for-conversion-optimization-2026/index.html");
const guideB = read("blog/how-to-collect-leads-automatically-no-code/index.html");
const guideC = read("blog/luxury-web-design-trends-for-saas-forms/index.html");

assert(robots.includes("Sitemap: https://boltfy.io/sitemap.xml"), "robots sitemap host");
assert(robots.includes("Disallow: /dashboard"), "robots blocks the dashboard");
assert(robots.includes("Disallow: /f/"), "robots blocks published forms");
assert(!robots.includes("boltfy.com"), "robots must not mention boltfy.com");

for (const url of [
  "https://boltfy.io/",
  "https://boltfy.io/about",
  "https://boltfy.io/blog",
  "https://boltfy.io/contact",
  "https://boltfy.io/privacy",
  "https://boltfy.io/terms",
  "https://boltfy.io/blog/best-form-builder-for-conversion-optimization-2026",
  "https://boltfy.io/blog/how-to-collect-leads-automatically-no-code",
  "https://boltfy.io/blog/luxury-web-design-trends-for-saas-forms",
]) {
  assert(sitemap.includes(`<loc>${url}</loc>`), `sitemap missing ${url}`);
}

assert(!sitemap.includes("boltfy.com"), "sitemap host drifted");
assert(!sitemap.includes("/dashboard"), "sitemap includes an account page");
assert(!sitemap.includes("/login"), "sitemap includes login");
assert(!sitemap.includes("/f/"), "sitemap includes a user form");

assert(llms.startsWith("# Boltfy"), "llms.txt title");
assert(llms.includes("https://boltfy.io/llms-full.txt"), "llms.txt links to the full corpus");
assert(llmsFull.includes("How do you publish the shorter form with Boltfy?"), "full corpus has guide A");
assert(llmsFull.includes("How do you move leads into another tool?"), "full corpus has guide B");
assert(llmsFull.includes("Which style controls does Boltfy store?"), "full corpus has guide C");
assert(!llmsFull.includes("aggregateRating"), "corpus must not invent a rating");

assert(home.includes('<link rel="canonical" href="https://boltfy.io/"'), "home canonical");
assert(home.includes("FAQPage"), "home FAQ schema");
assert(home.includes("Frequently asked questions"), "home crawlable FAQ");
assert(home.includes('id="seo-prerender"'), "home prerender block");
assert(!home.includes("aggregateRating"), "home must not claim a review rating");
assert(!home.includes("boltfy.com"), "home host drifted");

assert(blog.includes('<link rel="canonical" href="https://boltfy.io/blog"'), "blog canonical");
assert(about.includes("What it does not do"), "about crawlable limits");
assert(contact.includes("support@boltfy.io"), "contact email");
assert(guideA.includes("BlogPosting"), "article schema");
assert(guideA.includes("How do you publish the shorter form with Boltfy?"), "article A body");
assert(guideB.includes("How do you move leads into another tool?"), "article B body");
assert(guideC.includes("Which style controls does Boltfy store?"), "article C body");
assert(guideA !== guideB && guideB !== guideC, "articles must not share one HTML body");

const privateShell = home.includes("<title>Boltfy | Free form builder");
assert(privateShell, "home title");
assert(!fs.existsSync(path.join(dist, "dashboard", "index.html")), "dashboard must stay a client route");

console.log("SEO checks passed");
