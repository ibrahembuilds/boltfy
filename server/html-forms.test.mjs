import { describe, expect, it } from "vitest";
import { injectContactForm, parseHtmlForms, prepareHtml, rewriteHtml, SAMPLE_LANDING_HTML } from "./html-forms.mjs";

describe("parseHtmlForms", () => {
  it("reads a landing page form, labels, and select options", () => {
    const parsed = parseHtmlForms(SAMPLE_LANDING_HTML);
    expect(parsed.title).toBe("Northwind Bakery");
    expect(parsed.forms).toHaveLength(1);
    expect(parsed.forms[0].name).toBe("order");
    expect(parsed.forms[0].fields).toEqual([
      { name: "customer", label: "Your name", type: "text", required: true },
      { name: "email", label: "Email", type: "email", required: true },
      { name: "guests", label: "Guests", type: "number", required: false },
      { name: "cake", label: "Cake", type: "select", required: false, options: ["vanilla", "chocolate"] },
      { name: "notes", label: "Notes", type: "textarea", required: false },
    ]);
  });

  it("ignores submit buttons, disabled fields, and scripts that mention forms", () => {
    const html = `
      <script>const example = "<form><input name=fake></form>";</script>
      <form>
        <input type="submit" value="Go">
        <input name="skip" disabled>
        <input type="radio" name="plan" value="starter">
        <input type="radio" name="plan" value="team" required>
      </form>`;
    const parsed = parseHtmlForms(html);
    expect(parsed.forms).toHaveLength(1);
    expect(parsed.forms[0].fields).toEqual([
      { name: "plan", label: "plan", type: "radio", required: true, options: ["starter", "team"] },
    ]);
  });
});

describe("prepareHtml", () => {
  it("rewrites the form action and keeps the original fields", () => {
    const prepared = prepareHtml(SAMPLE_LANDING_HTML, { ingestUrl: "http://127.0.0.1:8787/api/v1/ingest/abc" });
    expect(prepared.rewrittenHtml).toContain('action="http://127.0.0.1:8787/api/v1/ingest/abc"');
    expect(prepared.rewrittenHtml).toContain('method="POST"');
    expect(prepared.rewrittenHtml).toContain('name="_boltfy_hp"');
    expect(prepared.rewrittenHtml).toContain('name="email"');
    expect(prepared.fields.map((field) => field.name)).toEqual(["customer", "email", "guests", "cake", "notes"]);
  });

  it("adds a contact form when the page has none and the caller asks for one", () => {
    const prepared = prepareHtml("<html><body><h1>Hello</h1></body></html>", {
      ingestUrl: "http://127.0.0.1:8787/api/v1/ingest/abc",
      injectContact: true,
    });
    expect(prepared.fields.map((field) => field.name)).toEqual(["name", "email", "message"]);
    expect(prepared.rewrittenHtml).toContain("name=\"message\"");
  });

  it("refuses a page with no form when contact injection is off", () => {
    expect(() => prepareHtml("<p>Just a brochure</p>", { ingestUrl: "http://example.test/in" })).toThrow(/No <form>/);
  });

  it("does not inject a second form when one already exists", () => {
    const html = injectContactForm(SAMPLE_LANDING_HTML);
    expect(parseHtmlForms(html).forms).toHaveLength(1);
  });

  it("drops a previous action so the page cannot keep posting somewhere else", () => {
    const rewritten = rewriteHtml(`<form action="https://evil.test/steal" method="get"><input name="email"></form>`, "http://boltfy.test/in");
    expect(rewritten).not.toContain("evil.test");
    expect(rewritten).toContain('method="POST"');
  });
});
