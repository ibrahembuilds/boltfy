// Turns a static HTML page into a list of form fields, and rewrites each
// <form> so it posts to a Boltfy ingest URL. No DOM library: the pages this
// is built for are ordinary marketing HTML, not nested templates.

const SKIP_TYPES = new Set(["submit", "button", "image", "reset", "file"]);
const RESERVED = new Set(["_boltfy_hp", "_boltfy_form"]);

export const SAMPLE_LANDING_HTML = `<!doctype html>
<html>
<head><title>Northwind Bakery</title></head>
<body>
  <h1>Northwind Bakery</h1>
  <p>Order a cake or ask about catering.</p>
  <form id="order" name="order">
    <label for="customer">Your name</label>
    <input id="customer" name="customer" type="text" required>
    <label>Email <input name="email" type="email" required placeholder="you@bakery.test"></label>
    <label for="guests">Guests</label>
    <input id="guests" name="guests" type="number" min="1">
    <label for="cake">Cake</label>
    <select id="cake" name="cake">
      <option value="vanilla">Vanilla</option>
      <option value="chocolate">Chocolate</option>
    </select>
    <label for="notes">Notes</label>
    <textarea id="notes" name="notes"></textarea>
    <button type="submit">Request a quote</button>
  </form>
</body>
</html>
`;

export const CONTACT_FORM_HTML = `<form id="contact" name="contact">
  <label for="boltfy-name">Name</label>
  <input id="boltfy-name" name="name" type="text" required>
  <label for="boltfy-email">Email</label>
  <input id="boltfy-email" name="email" type="email" required>
  <label for="boltfy-message">Message</label>
  <textarea id="boltfy-message" name="message" required></textarea>
  <button type="submit">Send</button>
</form>`;

function decode(text) {
  return String(text)
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function attr(tag, name) {
  const re = new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>]+))`, "i");
  const match = tag.match(re);
  if (!match) return null;
  return match[1] ?? match[2] ?? match[3] ?? "";
}

function isDisabled(tag) {
  return /\bdisabled\b/i.test(tag);
}

function isRequired(tag) {
  return /\brequired\b/i.test(tag);
}

function stripScriptsAndStyles(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");
}

function labelMaps(block) {
  const byId = new Map();
  const byName = new Map();
  const labelRe = /<label\b([^>]*)>([\s\S]*?)<\/label>/gi;
  let match;
  while ((match = labelRe.exec(block))) {
    const open = `<label ${match[1]}>`;
    const text = decode(match[2]);
    const forId = attr(open, "for");
    if (forId && text) byId.set(forId, text);
    const named = match[2].match(/<(?:input|textarea|select)\b[^>]*\bname\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>]+))/i);
    const name = named ? (named[1] ?? named[2] ?? named[3]) : null;
    if (name && text) byName.set(name, text);
  }
  return { byId, byName };
}

function selectOptions(tag) {
  const options = [];
  const optionRe = /<option\b([^>]*)>([\s\S]*?)<\/option>/gi;
  let match;
  while ((match = optionRe.exec(tag))) {
    const open = `<option ${match[1]}>`;
    const value = attr(open, "value");
    const text = decode(match[2]);
    const chosen = value != null && value !== "" ? value : text;
    if (chosen) options.push(chosen);
  }
  return options;
}

function extractFields(block) {
  const { byId, byName } = labelMaps(block);
  const fields = [];
  const seen = new Set();
  const controlRe = /<input\b[^>]*>|<textarea\b[^>]*>[\s\S]*?<\/textarea>|<select\b[^>]*>[\s\S]*?<\/select>/gi;
  let match;
  while ((match = controlRe.exec(block))) {
    const tag = match[0];
    const open = tag.match(/^<[^>]+>/)[0];
    if (isDisabled(open)) continue;
    const kind = /^<(input|textarea|select)\b/i.exec(tag)[1].toLowerCase();
    const type = kind === "input" ? (attr(open, "type") || "text").toLowerCase() : kind;
    if (SKIP_TYPES.has(type) || type === "hidden") continue;
    const name = attr(open, "name");
    if (!name || RESERVED.has(name)) continue;

    if (type === "radio") {
      const existing = fields.find((field) => field.name === name && field.type === "radio");
      const value = attr(open, "value") || "on";
      if (existing) {
        if (!existing.options.includes(value)) existing.options.push(value);
        if (isRequired(open)) existing.required = true;
        continue;
      }
    }

    if (seen.has(name)) continue;
    seen.add(name);

    const id = attr(open, "id");
    const label = (id && byId.get(id)) || byName.get(name) || attr(open, "aria-label") || attr(open, "placeholder") || name;
    const field = {
      name,
      label,
      type,
      required: isRequired(open),
    };
    if (type === "select") field.options = selectOptions(tag);
    if (type === "radio") field.options = [attr(open, "value") || "on"];
    fields.push(field);
  }
  return fields;
}

export function parseHtmlForms(html) {
  const source = stripScriptsAndStyles(String(html ?? ""));
  const titleMatch = source.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decode(titleMatch[1]) : "";
  const forms = [];
  const formRe = /<form\b[^>]*>[\s\S]*?<\/form>/gi;
  let match;
  let index = 0;
  while ((match = formRe.exec(source))) {
    index += 1;
    const block = match[0];
    const open = block.match(/<form\b[^>]*>/i)[0];
    const name = attr(open, "name") || attr(open, "id") || attr(open, "aria-label") || `Form ${index}`;
    forms.push({
      id: `form-${index}`,
      name,
      fields: extractFields(block),
    });
  }
  return { title, forms };
}

function escapeAttr(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;");
}

export function injectContactForm(html) {
  const source = String(html ?? "");
  const parsed = parseHtmlForms(source);
  if (parsed.forms.length > 0) return source;
  const block = `\n${CONTACT_FORM_HTML}\n`;
  if (/<\/body>/i.test(source)) return source.replace(/<\/body>/i, `${block}</body>`);
  return `${source}${block}`;
}

export function rewriteHtml(html, ingestUrl) {
  let index = 0;
  return String(html).replace(/<form\b([^>]*)>/gi, (full, attrs) => {
    index += 1;
    const cleaned = attrs
      .replace(/\saction\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      .replace(/\smethod\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
    const honeypot = `<input type="text" name="_boltfy_hp" tabindex="-1" autocomplete="off" aria-hidden="true" style="position:absolute;left:-9999px;height:0;width:0;opacity:0">`;
    const marker = `<input type="hidden" name="_boltfy_form" value="form-${index}">`;
    return `<form${cleaned} action="${escapeAttr(ingestUrl)}" method="POST">${honeypot}${marker}`;
  });
}

export function samplePayload(fields) {
  const payload = {};
  for (const field of fields) {
    if (field.type === "email") payload[field.name] = "qa@boltfy.test";
    else if (field.type === "tel") payload[field.name] = "+15551212";
    else if (field.type === "number") payload[field.name] = "2";
    else if (field.type === "url") payload[field.name] = "https://example.com";
    else if (field.type === "checkbox") payload[field.name] = "yes";
    else if (field.type === "date") payload[field.name] = "2026-11-03";
    else if ((field.type === "select" || field.type === "radio") && field.options?.length) payload[field.name] = field.options[0];
    else if (field.type === "textarea") payload[field.name] = "Test from Boltfy";
    else payload[field.name] = "Test from Boltfy";
  }
  return payload;
}

export function prepareHtml(html, { ingestUrl, injectContact = false } = {}) {
  let source = String(html ?? "");
  if (injectContact) source = injectContactForm(source);
  const parsed = parseHtmlForms(source);
  const fields = parsed.forms.flatMap((form) => form.fields);
  if (fields.length === 0) {
    const error = new Error(
      parsed.forms.length === 0
        ? "No <form> was found in this HTML. Turn on “Add a contact form” or paste a page that already has one."
        : "The form has no named fields. Give each input a name attribute."
    );
    error.status = 422;
    throw error;
  }
  return {
    title: parsed.title,
    forms: parsed.forms,
    fields,
    rewrittenHtml: rewriteHtml(source, ingestUrl),
  };
}
