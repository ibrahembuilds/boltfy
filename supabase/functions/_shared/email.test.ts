import { describe, expect, it } from "vitest";
import {
  applyMergeTags,
  buildFrom,
  buildUnsubscribeUrl,
  chunk,
  contentToHtml,
  describeResendError,
  escapeHtml,
  extractAddress,
  isValidEmail,
  looksLikeHtml,
  renderCampaignHtml,
  renderFormNotificationHtml,
  retryDelayMs,
  sanitizeDisplayName,
  submissionRows,
  textToHtml,
} from "./email";

describe("escapeHtml", () => {
  it("escapes the five dangerous characters", () => {
    expect(escapeHtml(`<img src=x onerror="alert('1')">&`)).toBe(
      "&lt;img src=x onerror=&quot;alert(&#39;1&#39;)&quot;&gt;&amp;",
    );
  });
  it("tolerates null/undefined/numbers", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
    expect(escapeHtml(42)).toBe("42");
  });
});

describe("isValidEmail", () => {
  it("accepts normal addresses", () => {
    expect(isValidEmail("a.b+tag@example.co.uk")).toBe(true);
  });
  it.each(["", "plain", "a@b", "a b@example.com", "a@@example.com", "a@example.c", 5, null])("rejects %s", (v) => {
    expect(isValidEmail(v)).toBe(false);
  });
  it("rejects overlong addresses", () => {
    expect(isValidEmail(`${"a".repeat(250)}@example.com`)).toBe(false);
  });
});

describe("chunk", () => {
  it("splits into batches and keeps the remainder", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
  it("handles empty input", () => {
    expect(chunk([], 100)).toEqual([]);
  });
  it("rejects a bad size instead of looping forever", () => {
    expect(() => chunk([1], 0)).toThrow();
    expect(() => chunk([1], 1.5)).toThrow();
  });
  it("makes 100-sized batches for a 250 person list", () => {
    const sizes = chunk(Array.from({ length: 250 }, (_, i) => i), 100).map((b) => b.length);
    expect(sizes).toEqual([100, 100, 50]);
  });
});

describe("plain text vs HTML content", () => {
  it("detects markup", () => {
    expect(looksLikeHtml("<p>Hello</p>")).toBe(true);
    expect(looksLikeHtml("Hello<br>world")).toBe(true);
    expect(looksLikeHtml("1 < 2 and 3 > 2")).toBe(false);
    expect(looksLikeHtml("Just text")).toBe(false);
  });

  it("turns blank-line separated text into paragraphs and single newlines into <br>", () => {
    const html = textToHtml("Hi there,\nhope you are well.\n\nSecond paragraph.");
    expect(html).toBe(
      '<p style="margin:0 0 16px;">Hi there,<br>hope you are well.</p><p style="margin:0 0 16px;">Second paragraph.</p>',
    );
  });

  it("normalises Windows line endings", () => {
    expect(textToHtml("a\r\nb")).toContain("a<br>b");
  });

  it("escapes markup typed into the plain-text editor", () => {
    const html = textToHtml(`<script>alert(1)</script> & "quotes"`);
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("&amp;");
  });

  it("links URLs but leaves sentence punctuation outside the link", () => {
    const html = textToHtml("See https://example.com/a?x=1&y=2.");
    expect(html).toContain('<a href="https://example.com/a?x=1&amp;y=2" style="color:#4f46e5;">https://example.com/a?x=1&amp;y=2</a>.');
  });

  it("does not let a quote in a URL break out of the href attribute", () => {
    const html = textToHtml(`go to https://e.com/"onmouseover="alert(1)`);
    expect(html).not.toMatch(/href="[^"]*"[^>]*onmouseover=/);
  });

  it("passes author HTML through untouched", () => {
    const authored = "<p>Already <b>HTML</b></p>";
    expect(contentToHtml(authored)).toBe(authored);
  });

  it("returns an empty string for blank text", () => {
    expect(textToHtml("  \n\n  ")).toBe("");
  });
});

describe("applyMergeTags", () => {
  it("fills name, first_name and email, tolerating spaces and case", () => {
    expect(applyMergeTags("Hi {{ first_name }} / {{NAME}} / {{email}}", { name: "Sam Smith", email: "s@x.com" })).toBe(
      "Hi Sam / Sam Smith / s@x.com",
    );
  });
  it("falls back to 'there' when there is no name", () => {
    expect(applyMergeTags("Hi {{name}} {{first_name}}", { name: "  ", email: "s@x.com" })).toBe("Hi there there");
    expect(applyMergeTags("Hi {{name}}", { name: null, email: "s@x.com" })).toBe("Hi there");
  });
  it("escapes visitor-controlled values", () => {
    const out = applyMergeTags("Hi {{name}}", { name: `<img src=x onerror=alert(1)>`, email: "s@x.com" });
    expect(out).not.toContain("<img");
    expect(out).toContain("&lt;img");
  });
  it("leaves unknown tags alone", () => {
    expect(applyMergeTags("{{other}}", { name: "A", email: "a@b.co" })).toBe("{{other}}");
  });
});

describe("From header", () => {
  it("keeps the mailbox on the platform address and only sets the display name", () => {
    expect(buildFrom("Alice Co", "Boltfy <noreply@boltfy.com>")).toBe("Alice Co <noreply@boltfy.com>");
  });
  it("falls back to the platform display name", () => {
    expect(buildFrom("", "Boltfy <noreply@boltfy.com>")).toBe("Boltfy <noreply@boltfy.com>");
    expect(buildFrom(null, "noreply@boltfy.com")).toBe("Boltfy <noreply@boltfy.com>");
  });
  it("cannot be used to smuggle another address or extra headers", () => {
    const from = buildFrom(`CEO <ceo@boltfy.com>\r\nBcc: victim@example.com`, "Boltfy <noreply@boltfy.com>");
    expect(from).not.toMatch(/[\r\n]/);
    expect(from.match(/@/g)).toHaveLength(1);
    expect(from.endsWith("<noreply@boltfy.com>")).toBe(true);
  });
  it("sanitises display names", () => {
    expect(sanitizeDisplayName('A "B" <c>, d;e')).toBe("A B c d e");
    expect(sanitizeDisplayName("security@boltfy.com")).not.toContain("@");
    expect(sanitizeDisplayName("x".repeat(200))).toHaveLength(60);
  });
  it("extracts the bare address", () => {
    expect(extractAddress("Boltfy <noreply@boltfy.com>")).toBe("noreply@boltfy.com");
    expect(extractAddress(" noreply@boltfy.com ")).toBe("noreply@boltfy.com");
  });
});

describe("unsubscribe URL", () => {
  it("builds a token link without double slashes", () => {
    expect(buildUnsubscribeUrl("https://app.example.com/", "abc-123")).toBe("https://app.example.com/unsubscribe?token=abc-123");
  });
  it("encodes the token", () => {
    expect(buildUnsubscribeUrl("https://a.co", "a b&c")).toBe("https://a.co/unsubscribe?token=a%20b%26c");
  });
});

describe("renderCampaignHtml", () => {
  const base = {
    bodyHtml: "<p>Body</p>",
    unsubscribeUrl: "https://app.example.com/unsubscribe?token=t",
    logoUrl: "https://app.example.com/icon.png",
    subject: "Hello",
  };

  it("always contains the unsubscribe link and the body", () => {
    const html = renderCampaignHtml(base);
    expect(html).toContain('href="https://app.example.com/unsubscribe?token=t"');
    expect(html).toContain("<p>Body</p>");
  });

  it("includes sender name and postal address, escaped", () => {
    const html = renderCampaignHtml({ ...base, senderName: "A&B <Co>", postalAddress: "1 Main St\nSpringfield <IL>" });
    expect(html).toContain("A&amp;B &lt;Co&gt;");
    expect(html).toContain("1 Main St<br>Springfield &lt;IL&gt;");
  });

  it("escapes the subject used in <title>", () => {
    expect(renderCampaignHtml({ ...base, subject: "</title><script>x</script>" })).not.toContain("<script>x");
  });

  it("does not carry the preheader in <head> (invalid HTML in the old template)", () => {
    const html = renderCampaignHtml(base);
    expect(html.slice(html.indexOf("<head>"), html.indexOf("</head>"))).not.toContain("<span");
  });
});

describe("renderFormNotificationHtml", () => {
  it("escapes visitor-supplied labels and values (it used to inject them as raw HTML)", () => {
    const html = renderFormNotificationHtml({
      formName: "<b>Form</b>",
      rows: [{ label: "<i>Msg</i>", value: `<a href="https://evil.test">click</a>\nline2` }],
      dashboardUrl: "https://app.example.com/forms",
    });
    expect(html).not.toContain("<a href=\"https://evil.test\"");
    expect(html).not.toContain("<i>Msg</i>");
    expect(html).not.toContain("<b>Form</b>");
    expect(html).toContain("&lt;a href=&quot;https://evil.test&quot;&gt;click&lt;/a&gt;<br>line2");
  });
});

describe("submissionRows", () => {
  const fields = [
    { id: "f1", label: "Name" },
    { id: "f2", label: "Subscribe" },
    { id: "f3", label: "Notes" },
    { id: "f4" },
  ];
  it("uses labels, keeps form order, hides empty and false values, renders true as Yes", () => {
    const rows = submissionRows(fields, { f3: "hello", f1: "Sam", f2: true, f4: "x", extra: "ignored" });
    expect(rows).toEqual([
      { label: "Name", value: "Sam" },
      { label: "Subscribe", value: "Yes" },
      { label: "Notes", value: "hello" },
      { label: "f4", value: "x" },
    ]);
    expect(submissionRows(fields, { f1: "", f2: false, f3: null })).toEqual([]);
  });
  it("copes with garbage fields", () => {
    expect(submissionRows("nope", { a: 1 })).toEqual([]);
    expect(submissionRows([null, { id: 3 }], { a: 1 })).toEqual([]);
  });
});

describe("Resend helpers", () => {
  it("surfaces provider messages", () => {
    expect(describeResendError({ message: "Domain not verified" }, 403)).toBe("Domain not verified");
    expect(describeResendError({ name: "validation_error" }, 422)).toBe("validation_error");
    expect(describeResendError(null, 502)).toBe("Email provider returned HTTP 502");
  });
  it("backs off exponentially, honours Retry-After, and is capped", () => {
    expect(retryDelayMs(0)).toBe(500);
    expect(retryDelayMs(2)).toBe(2000);
    expect(retryDelayMs(10)).toBe(8000);
    expect(retryDelayMs(0, "3")).toBe(3000);
    expect(retryDelayMs(0, "999")).toBe(10000);
    expect(retryDelayMs(1, "garbage")).toBe(1000);
  });
});
