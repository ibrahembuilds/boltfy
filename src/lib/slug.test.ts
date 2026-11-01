import { describe, expect, it } from "vitest";
import { makeSlug, resolveSlug, slugify } from "./slug";

describe("slugify", () => {
  it("lower-cases, replaces punctuation and collapses runs", () => {
    expect(slugify("  My   Contact Form!! ")).toBe("my-contact-form");
  });
  it("strips accents", () => {
    expect(slugify("Café Résumé")).toBe("cafe-resume");
  });
  it("neutralises path and URL tricks", () => {
    expect(slugify("../admin/../x?y=1#z")).toBe("admin-x-y-1-z");
  });
  it("returns an empty string when nothing usable is left", () => {
    expect(slugify("نموذج الاتصال")).toBe("");
    expect(slugify("联系我们")).toBe("");
    expect(slugify("!!!")).toBe("");
  });
  it("is bounded and never ends with a dash", () => {
    const s = slugify(`${"a".repeat(59)} b`);
    expect(s.length).toBeLessThanOrEqual(60);
    expect(s.endsWith("-")).toBe(false);
  });
});

describe("makeSlug / resolveSlug", () => {
  it("falls back to a random slug for non-Latin names (and does not collide)", () => {
    let n = 0;
    const gen = () => `x${n++}`;
    expect(makeSlug("نموذج", gen)).toBe("form-x0");
    expect(makeSlug("نموذج", gen)).toBe("form-x1");
  });
  it("prefers the name when it has usable characters", () => {
    expect(makeSlug("Newsletter")).toBe("newsletter");
  });
  it("normalises a typed slug and falls back to the name", () => {
    expect(resolveSlug("My Slug", "ignored")).toBe("my-slug");
    expect(resolveSlug("  ", "Hello World")).toBe("hello-world");
    expect(resolveSlug("###", "Hello World")).toBe("hello-world");
  });
  it("the real random suffix produces URL-safe slugs", () => {
    expect(makeSlug("نموذج")).toMatch(/^form-[a-z2-9]{6}$/);
  });
});
