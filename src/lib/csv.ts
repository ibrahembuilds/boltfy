/**
 * CSV helpers: a safe writer for exports and a tolerant parser for imports.
 *
 * Export safety: form responses are typed by anonymous visitors and then
 * opened by the form owner in Excel / Sheets. A cell that begins with
 * = + - @ (or a tab / carriage return) is interpreted as a formula there
 * ("CSV injection"), so such cells are prefixed with an apostrophe, which
 * spreadsheets treat as "this is text".
 */

const FORMULA_START = /^[=+\-@\t\r]/;

export function escapeCsvCell(value: unknown): string {
  let text = value === null || value === undefined ? "" : String(value);
  if (FORMULA_START.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

/**
 * Rows -> CSV text. CRLF line endings and a UTF-8 BOM so Excel opens
 * non-Latin text (Arabic, Chinese, accents...) correctly instead of garbling it.
 */
export function toCsv(headers: readonly string[], rows: readonly (readonly unknown[])[]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeCsvCell).join(","));
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

/** Guess the delimiter from the header line (European Excel exports use ";"). */
function detectDelimiter(text: string): string {
  const firstLine = text.split(/\r\n|\n|\r/, 1)[0] ?? "";
  const counts = [",", ";", "\t"].map((d) => [d, firstLine.split(d).length - 1] as const);
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 0 ? counts[0][0] : ",";
}

/** RFC 4180 parser: quoted fields, doubled quotes, embedded newlines, CRLF/LF, BOM. */
export function parseCsv(input: string): string[][] {
  const text = input.replace(/^\uFEFF/, "");
  const delimiter = detectDelimiter(text);
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"' && field === "") {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

// Same rule the database enforces (subscribers.valid_email).
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export interface ParsedSubscribers {
  valid: { email: string; name: string }[];
  /** Rows that were skipped because the address is not valid. */
  invalid: string[];
  /** Rows skipped because the same address appeared earlier in the file. */
  duplicates: number;
}

/**
 * Subscribers from a CSV with an "email" column (and optionally "name").
 * Without a header row, the first column is taken as the address and the
 * second as the name. Addresses are trimmed and lower-cased.
 */
export function parseSubscriberCsv(text: string): ParsedSubscribers {
  const rows = parseCsv(text);
  const result: ParsedSubscribers = { valid: [], invalid: [], duplicates: 0 };
  if (rows.length === 0) return result;

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const emailCol = header.findIndex((h) => h === "email" || h === "e-mail" || h === "email address");
  const hasHeader = emailCol !== -1;
  const nameCol = hasHeader ? header.findIndex((h) => h === "name" || h === "full name" || h === "first name") : 1;
  const col = hasHeader ? emailCol : 0;
  const seen = new Set<string>();

  for (const row of hasHeader ? rows.slice(1) : rows) {
    const email = (row[col] ?? "").trim().toLowerCase();
    if (!email) continue;
    if (!EMAIL_RE.test(email) || email.length > 254) {
      result.invalid.push(email);
      continue;
    }
    if (seen.has(email)) {
      result.duplicates++;
      continue;
    }
    seen.add(email);
    const name = (nameCol >= 0 ? row[nameCol] ?? "" : "").trim().slice(0, 200);
    result.valid.push({ email, name: name || email.split("@")[0] });
  }
  return result;
}
