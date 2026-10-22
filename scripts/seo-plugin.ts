import fs from "node:fs";
import path from "node:path";
import type { Plugin, ResolvedConfig } from "vite";
import { publicDocuments } from "../src/seo/documents";
import { llmsFullTxt, llmsTxt, robotsTxt, sitemapXml } from "../src/seo/files";
import { applySeoTemplate } from "../src/seo/html";

function writeSeoFiles(directory: string): void {
  fs.mkdirSync(directory, { recursive: true });
  const files: Record<string, string> = {
    "robots.txt": robotsTxt(),
    "sitemap.xml": sitemapXml(),
    "llms.txt": llmsTxt(),
    "llms-full.txt": llmsFullTxt(),
  };

  for (const [name, contents] of Object.entries(files)) {
    fs.writeFileSync(path.join(directory, name), contents);
  }
}

export function boltfySeoPlugin(): Plugin {
  let config: ResolvedConfig | undefined;

  return {
    name: "boltfy-seo",
    configResolved(resolved) {
      config = resolved;
    },
    buildStart() {
      if (!config) return;
      writeSeoFiles(path.join(config.root, "public"));
    },
    closeBundle() {
      if (!config) return;
      const dist = config.build.outDir;
      writeSeoFiles(dist);

      const templatePath = path.join(dist, "index.html");
      const template = fs.readFileSync(templatePath, "utf8");

      for (const doc of publicDocuments) {
        const html = applySeoTemplate(template, doc);
        if (doc.path === "/") {
          fs.writeFileSync(templatePath, html);
          continue;
        }
        const dir = path.join(dist, doc.path.replace(/^\//, ""));
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, "index.html"), html);
      }
    },
  };
}
