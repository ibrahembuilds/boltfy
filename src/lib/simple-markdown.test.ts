import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parseMarkdown, safeHref } from "./simple-markdown";

describe("parseMarkdown", () => {
  it("reads the platform guide into headings, steps, and code", () => {
    const source = readFileSync("docs/platform.md", "utf8");
    const blocks = parseMarkdown(source);
    expect(blocks.find((block) => block.type === "h" && block.level === 1)).toMatchObject({
      text: "How Boltfy works",
      id: "how-boltfy-works",
    });
    const sections = blocks.filter((block) => block.type === "h" && block.level === 2).map((block) => block.type === "h" ? block.text : "");
    expect(sections).toEqual([
      "Build a form in Boltfy",
      "Connect a page you already have",
      "What happens when someone submits",
      "What Boltfy refuses",
      "For an agent",
      "Run it on your machine",
      "Where the code lives",
    ]);
    expect(blocks.some((block) => block.type === "code" && block.text.includes("npm run connect"))).toBe(true);
    expect(blocks.some((block) => block.type === "ol")).toBe(true);
  });

  it("keeps only safe links", () => {
    expect(safeHref("/docs")).toBe("/docs");
    expect(safeHref("https://example.com")).toBe("https://example.com");
    expect(safeHref("javascript:alert(1)")).toBeNull();
  });
});
