// Pure helpers shared by the email edge functions.
//
// No imports and no Deno/Node APIs on purpose: the same file is executed by
// Deno inside Supabase and unit-tested by Vitest (see email.test.ts), so the
// logic that decides what ends up in a stranger's inbox is covered by tests
// even though the edge runtime itself is not.

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/** Escape text for safe use in HTML text nodes and quoted attributes. */
export function escapeHtml(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

// Same shape the database enforces (subscribers.valid_email).
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export function isValidEmail(value: unknown): value is string {
  return typeof value === "string" && value.length <= 254 && EMAIL_RE.test(value);
}

export function chunk<T>(items: readonly T[], size: number): T[][] {
  if (!Number.isInteger(size) || size < 1) throw new Error("chunk size must be a positive integer");
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

const HTML_TAG_RE = /<\/?(?:p|div|br|h[1-6]|a|img|table|tr|td|ul|ol|li|span|strong|em|b|i|u|center|blockquote|hr|body|html)\b[^>]*>/i;

/** Does the author's content already contain markup (vs. plain text)? */
export function looksLikeHtml(content: string): boolean {
  return HTML_TAG_RE.test(content);
}

/**
 * Plain text -> HTML. The campaign editor is a plain textarea, so authors
 * type paragraphs with newlines; without this they all collapse into one
 * line in the inbox. Text is escaped first, then bare URLs are linked.
 */
export function textToHtml(text: string): string {
  const paragraphs = text
    .replace(/\r\n?/g, "\n")
    .trim()
    .split(/\n{2,}/)
    .filter((p) => p.trim() !== "");

  return paragraphs
    .map((p) => {
      const linked = escapeHtml(p).replace(/https?:\/\/[^\s<]+/g, (url) => {
        // keep sentence punctuation out of the link
        const trailing = url.match(/[.,;:!?)]+$/)?.[0] ?? "";
        const clean = trailing ? url.slice(0, -trailing.length) : url;
        return `<a href="${clean}" style="color:#4f46e5;">${clean}</a>${trailing}`;
      });
      return `<p style="margin:0 0 16px;">${linked.replace(/\n/g, "<br>")}</p>`;
    })
    .join("");
}

/** Author content (HTML or plain text) -> HTML body. */
export function contentToHtml(content: string): string {
  return looksLikeHtml(content) ? content : textToHtml(content);
}

/**
 * Replace {{name}}, {{first_name}} and {{email}} with the recipient's
 * values. Values come from public form submissions, so they are escaped.
 */
export function applyMergeTags(html: string, recipient: { name?: string | null; email: string }): string {
  const name = (recipient.name ?? "").trim();
  const first = name.split(/\s+/)[0] ?? "";
  return html.replace(/\{\{\s*(name|first_name|email)\s*\}\}/gi, (_m, key: string) => {
    switch (key.toLowerCase()) {
      case "name":
        return escapeHtml(name || "there");
      case "first_name":
        return escapeHtml(first || "there");
      default:
        return escapeHtml(recipient.email);
    }
  });
}

/**
 * Display name for the From header: no quotes, angle brackets or line breaks
 * (header injection), and no "@" -- mail clients show the display name more
 * prominently than the address, so a name like "security@boltfy.com" would
 * make a mail from any account look like it came from that mailbox.
 */
export function sanitizeDisplayName(name: string | null | undefined): string {
  return (name ?? "")
    .replace(/[\r\n"<>,;:\\@]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60);
}

/** "Boltfy <noreply@boltfy.com>" or "noreply@boltfy.com" -> "noreply@boltfy.com" */
export function extractAddress(from: string): string {
  const m = from.match(/<([^<>]+)>/);
  return (m ? m[1] : from).trim();
}

/**
 * Build the From header. The mailbox always stays on the platform's verified
 * domain; the sender only chooses the display name. (Accepting a full
 * client-supplied `from` would let any account send as anyone on that domain.)
 */
export function buildFrom(displayName: string | null | undefined, platformFrom: string): string {
  const address = extractAddress(platformFrom);
  // Only reuse the platform's display name when it actually has one
  // ("Boltfy <a@b.c>"); a bare address must not become its own display name.
  const platformName = platformFrom.includes("<") ? platformFrom.replace(/<[^>]*>/, "") : "";
  const name = sanitizeDisplayName(displayName) || sanitizeDisplayName(platformName) || "Boltfy";
  return `${name} <${address}>`;
}

export function buildUnsubscribeUrl(appUrl: string, token: string): string {
  return `${appUrl.replace(/\/+$/, "")}/unsubscribe?token=${encodeURIComponent(token)}`;
}

export interface CampaignHtmlOptions {
  bodyHtml: string;
  unsubscribeUrl: string;
  logoUrl: string;
  subject: string;
  senderName?: string | null;
  postalAddress?: string | null;
}

export function renderCampaignHtml(o: CampaignHtmlOptions): string {
  const sender = escapeHtml(o.senderName?.trim() || "us");
  const address = o.postalAddress?.trim()
    ? `<p style="margin:8px 0 0;">${escapeHtml(o.postalAddress.trim()).replace(/\r?\n/g, "<br>")}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(o.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
<div style="max-width:600px;margin:0 auto;padding:32px 16px;">
  <div style="background:#ffffff;border-radius:16px;padding:32px;line-height:1.7;font-size:16px;">
    <div style="text-align:center;margin-bottom:24px;"><img src="${escapeHtml(o.logoUrl)}" alt="" width="48" height="48" style="border-radius:12px;"></div>
    ${o.bodyHtml}
  </div>
  <div style="text-align:center;color:#64748b;font-size:12px;line-height:1.6;padding:20px 8px 0;">
    <p style="margin:0;">You're receiving this because you subscribed to updates from ${sender}.</p>
    ${address}
    <p style="margin:8px 0 0;"><a href="${escapeHtml(o.unsubscribeUrl)}" style="color:#4f46e5;">Unsubscribe</a> &middot; Sent with Boltfy</p>
  </div>
</div>
</body>
</html>`;
}

export interface NotificationRow {
  label: string;
  value: string;
}

/** Owner notification for a new form response. Everything visitor-supplied is escaped. */
export function renderFormNotificationHtml(o: { formName: string; rows: NotificationRow[]; dashboardUrl: string }): string {
  const rows = o.rows
    .map(
      (r) =>
        `<p style="margin:8px 0;"><strong>${escapeHtml(r.label)}:</strong> ${escapeHtml(r.value).replace(/\r?\n/g, "<br>")}</p>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><title>New response</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<div style="max-width:600px;margin:0 auto;padding:32px 16px;">
  <div style="background:#ffffff;border-radius:16px;padding:32px;">
    <h1 style="color:#1e293b;font-size:22px;margin:0 0 8px;">New response: ${escapeHtml(o.formName)}</h1>
    <p style="color:#475569;margin:0 0 16px;">Someone just submitted your form.</p>
    <div style="background:#f1f5f9;border-radius:8px;padding:16px;">${rows}</div>
    <p style="margin:24px 0 0;"><a href="${escapeHtml(o.dashboardUrl)}" style="color:#4f46e5;">View all responses</a></p>
  </div>
</div>
</body></html>`;
}

/** Turn a stored submission (keyed by field id) into labelled rows in form order. */
export function submissionRows(
  fields: unknown,
  metadata: Record<string, unknown>,
): NotificationRow[] {
  const list = Array.isArray(fields) ? (fields as Array<{ id?: unknown; label?: unknown }>) : [];
  const rows: NotificationRow[] = [];
  for (const f of list) {
    if (typeof f?.id !== "string") continue;
    const raw = metadata[f.id];
    if (raw === undefined || raw === null || raw === "" || raw === false) continue;
    rows.push({
      label: typeof f.label === "string" && f.label ? f.label : f.id,
      value: raw === true ? "Yes" : String(raw),
    });
  }
  return rows;
}

/** Best human-readable message from a Resend error body. */
export function describeResendError(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const b = body as { message?: unknown; name?: unknown };
    if (typeof b.message === "string" && b.message) return b.message;
    if (typeof b.name === "string" && b.name) return b.name;
  }
  return `Email provider returned HTTP ${status}`;
}

/** Delay before retrying a rate-limited (429) / 5xx request. */
export function retryDelayMs(attempt: number, retryAfterHeader?: string | null): number {
  const seconds = Number(retryAfterHeader);
  if (Number.isFinite(seconds) && seconds > 0) return Math.min(seconds, 10) * 1000;
  return Math.min(500 * 2 ** attempt, 8000);
}
