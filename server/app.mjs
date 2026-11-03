import { createHash, randomBytes, randomUUID } from "node:crypto";
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import { prepareHtml, samplePayload } from "./html-forms.mjs";

const { Client, Pool } = pg;

const MAX_HTML = 200_000;
const MAX_BODY = 48_000;
const DEFAULT_RATE = 60;

function quoteIdent(name) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) throw new Error("Invalid database name");
  return `"${name}"`;
}

export function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export async function ensureDatabase(databaseUrl) {
  const url = new URL(databaseUrl);
  const dbName = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!dbName) throw new Error("DATABASE_URL is missing a database name");
  const admin = new URL(databaseUrl);
  admin.pathname = "/postgres";
  const client = new Client({ connectionString: admin.toString() });
  await client.connect();
  try {
    const exists = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
    if (exists.rowCount === 0) {
      await client.query(`CREATE DATABASE ${quoteIdent(dbName)}`);
    }
  } finally {
    await client.end();
  }
}

async function migrate(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS connect_api_keys (
      id uuid PRIMARY KEY,
      name text NOT NULL,
      token_hash text NOT NULL UNIQUE,
      token_prefix text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS connect_endpoints (
      id uuid PRIMARY KEY,
      name text NOT NULL,
      slug text NOT NULL UNIQUE,
      source_html text NOT NULL,
      rewritten_html text NOT NULL,
      fields jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS connect_submissions (
      id uuid PRIMARY KEY,
      endpoint_id uuid NOT NULL REFERENCES connect_endpoints(id) ON DELETE CASCADE,
      payload jsonb NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_connect_submissions_endpoint
      ON connect_submissions(endpoint_id, created_at DESC);
  `);
}

function newSlug() {
  return randomBytes(9).toString("base64url");
}

function isLoopback(req) {
  const addr = req.socket.remoteAddress || "";
  return addr === "127.0.0.1" || addr === "::1" || addr === "::ffff:127.0.0.1";
}

function publicBase(req, port) {
  if (process.env.BOLTFY_PUBLIC_URL) return process.env.BOLTFY_PUBLIC_URL.replace(/\/$/, "");
  const host = req.headers.host || `127.0.0.1:${port}`;
  const proto = req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  return `${proto}://${host}`;
}

function ingestUrl(base, slug) {
  return `${base}/api/v1/ingest/${slug}`;
}

function curlFor(url, fields) {
  const payload = samplePayload(fields);
  const body = new URLSearchParams(payload).toString();
  return `curl -sS -X POST ${JSON.stringify(url)} -H "Accept: application/json" -H "Content-Type: application/x-www-form-urlencoded" --data ${JSON.stringify(body)}`;
}

function mapEndpoint(row, base) {
  const fields = row.fields;
  const url = ingestUrl(base, row.slug);
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    ingestUrl: url,
    fields,
    rewrittenHtml: row.rewritten_html,
    submissionCount: Number(row.submission_count ?? 0),
    createdAt: row.created_at,
    curl: curlFor(url, fields),
  };
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY && size > MAX_HTML) {
      const error = new Error("Request body is too large.");
      error.status = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function parseUrlEncoded(text) {
  const params = new URLSearchParams(text);
  const out = {};
  for (const [key, value] of params) out[key] = value;
  return out;
}

function parseMultipart(buffer, contentType) {
  const match = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType);
  if (!match) {
    const error = new Error("Multipart body is missing a boundary.");
    error.status = 400;
    throw error;
  }
  const boundary = match[1] || match[2];
  const text = buffer.toString("utf8");
  const parts = text.split(`--${boundary}`);
  const out = {};
  for (const part of parts) {
    if (!part || part.startsWith("--")) continue;
    const nameMatch = /name="([^"]+)"/i.exec(part);
    if (!nameMatch) continue;
    if (/filename="/i.test(part)) continue;
    const splitAt = part.indexOf("\r\n\r\n");
    if (splitAt === -1) continue;
    let value = part.slice(splitAt + 4).replace(/\r\n$/, "");
    out[nameMatch[1]] = value;
  }
  return out;
}

function parsePayload(buffer, contentType) {
  const type = (contentType || "").toLowerCase();
  if (type.includes("application/json")) {
    try {
      const value = JSON.parse(buffer.toString("utf8") || "{}");
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        const error = new Error("JSON body must be an object.");
        error.status = 400;
        throw error;
      }
      return value;
    } catch (error) {
      if (error.status) throw error;
      const wrapped = new Error("Invalid JSON.");
      wrapped.status = 400;
      throw wrapped;
    }
  }
  if (type.includes("multipart/form-data")) return parseMultipart(buffer, contentType);
  return parseUrlEncoded(buffer.toString("utf8"));
}

function cleanSubmission(raw, fields) {
  const allowed = new Set(fields.map((field) => field.name));
  const honeypot = String(raw._boltfy_hp ?? "").trim();
  const formId = raw._boltfy_form ? String(raw._boltfy_form).slice(0, 40) : null;
  const payload = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!allowed.has(key)) continue;
    if (value == null) continue;
    payload[key] = String(value).slice(0, 5000);
  }
  return { honeypot, formId, payload };
}

function wantsHtml(req) {
  const accept = String(req.headers.accept || "");
  const type = String(req.headers["content-type"] || "");
  if (accept.includes("application/json")) return false;
  if (type.includes("application/json")) return false;
  return true;
}

function thankYouHtml() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Received</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; font-family: ui-sans-serif, system-ui, sans-serif; background: #f8fafc; color: #0f172a; }
    main { max-width: 28rem; padding: 2rem; text-align: center; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { color: #475569; }
  </style>
</head>
<body>
  <main>
    <h1>Received</h1>
    <p>This form is connected to Boltfy. The response is in the dashboard.</p>
  </main>
</body>
</html>`;
}

function send(res, status, body, type = "application/json; charset=utf-8") {
  const payload = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": type,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, content-type, accept",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
    "Cache-Control": "no-store",
  });
  res.end(payload);
}

function bearer(req) {
  const header = String(req.headers.authorization || "");
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : "";
}

function openApi(base) {
  return {
    openapi: "3.0.3",
    info: {
      title: "Boltfy Connect",
      version: "1.0.0",
      description: "Backend for any HTML form. Paste a page, post to the ingest URL, read submissions from the dashboard or from an agent. Management routes need Authorization: Bearer <api key>. The ingest URL is public on purpose so a static site can post to it. See AGENTS.md and llms.txt.",
    },
    servers: [{ url: base }],
    paths: {
      "/health": { get: { summary: "Liveness", responses: { "200": { description: "OK" } } } },
      "/api/v1/endpoints": {
        get: { summary: "List endpoints", security: [{ bearer: [] }] },
        post: { summary: "Create an endpoint from HTML", security: [{ bearer: [] }] },
      },
      "/api/v1/endpoints/{slug}": {
        get: { summary: "Get one endpoint, including rewritten HTML", security: [{ bearer: [] }] },
        delete: { summary: "Delete an endpoint and its submissions", security: [{ bearer: [] }] },
      },
      "/api/v1/endpoints/{slug}/submissions": { get: { summary: "List submissions", security: [{ bearer: [] }] } },
      "/api/v1/endpoints/{slug}/test": { post: { summary: "Store one sample submission built from the fields", security: [{ bearer: [] }] } },
      "/api/v1/ingest/{slug}": { post: { summary: "Public form ingest. Form-encoded, multipart, or JSON. Unknown keys are dropped. A filled _boltfy_hp field is ignored." } },
    },
    components: { securitySchemes: { bearer: { type: "http", scheme: "bearer" } } },
  };
}

async function ensureKey(pool, { persistDevKey, keyFile }) {
  if (process.env.BOLTFY_API_KEY) {
    const token = process.env.BOLTFY_API_KEY.trim();
    const tokenHash = hashToken(token);
    await pool.query(
      `INSERT INTO connect_api_keys (id, name, token_hash, token_prefix)
       VALUES ($1, 'env', $2, $3)
       ON CONFLICT (token_hash) DO NOTHING`,
      [randomUUID(), tokenHash, token.slice(0, 12)]
    );
    return token;
  }
  if (persistDevKey) {
    try {
      const existing = (await readFile(keyFile, "utf8")).trim();
      if (existing) {
        await pool.query(
          `INSERT INTO connect_api_keys (id, name, token_hash, token_prefix)
           VALUES ($1, 'dev', $2, $3)
           ON CONFLICT (token_hash) DO NOTHING`,
          [randomUUID(), hashToken(existing), existing.slice(0, 12)]
        );
        return existing;
      }
    } catch {
      // no key file yet
    }
  }
  const token = `bfy_${randomBytes(24).toString("base64url")}`;
  await pool.query(
    `INSERT INTO connect_api_keys (id, name, token_hash, token_prefix) VALUES ($1, 'dev', $2, $3)`,
    [randomUUID(), hashToken(token), token.slice(0, 12)]
  );
  if (persistDevKey) {
    await mkdir(path.dirname(keyFile), { recursive: true });
    await writeFile(keyFile, `${token}\n`, { mode: 0o600 });
  }
  return token;
}

export async function startConnectServer({
  port = 0,
  databaseUrl = process.env.DATABASE_URL || "postgres://postgres:postgres@127.0.0.1:5432/boltfy",
  persistDevKey = false,
  allowDevSession = true,
  rateLimit = DEFAULT_RATE,
  keyFile = path.resolve(process.cwd(), ".boltfy/dev-key"),
  llmsPath = path.resolve(process.cwd(), "llms.txt"),
} = {}) {
  await ensureDatabase(databaseUrl);
  const pool = new Pool({ connectionString: databaseUrl });
  await migrate(pool);
  const devKey = await ensureKey(pool, { persistDevKey, keyFile });
  const hits = new Map();

  function tooMany(slug) {
    const now = Date.now();
    const recent = (hits.get(slug) || []).filter((stamp) => now - stamp < 60_000);
    if (recent.length >= rateLimit) {
      hits.set(slug, recent);
      return true;
    }
    recent.push(now);
    hits.set(slug, recent);
    return false;
  }

  async function authed(req) {
    const token = bearer(req);
    if (!token) return null;
    const found = await pool.query("SELECT id FROM connect_api_keys WHERE token_hash = $1", [hashToken(token)]);
    return found.rowCount ? token : null;
  }

  async function loadEndpoint(slug, base) {
    const result = await pool.query(
      `SELECT e.*, (SELECT count(*) FROM connect_submissions s WHERE s.endpoint_id = e.id) AS submission_count
       FROM connect_endpoints e WHERE slug = $1`,
      [slug]
    );
    if (result.rowCount === 0) return null;
    return mapEndpoint(result.rows[0], base);
  }

  const server = createServer(async (req, res) => {
    try {
      if (req.method === "OPTIONS") {
        send(res, 204, "");
        return;
      }
      const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
      const pathName = url.pathname;
      const base = publicBase(req, server.address()?.port || port);

      if (req.method === "GET" && pathName === "/health") {
        send(res, 200, { ok: true, service: "boltfy-connect" });
        return;
      }
      if (req.method === "GET" && pathName === "/llms.txt") {
        const text = await readFile(llmsPath, "utf8");
        send(res, 200, text, "text/plain; charset=utf-8");
        return;
      }
      if (req.method === "GET" && pathName === "/api/v1/openapi.json") {
        send(res, 200, openApi(base));
        return;
      }
      if (req.method === "GET" && pathName === "/api/v1/dev/session") {
        if (!allowDevSession || !isLoopback(req)) {
          send(res, 403, { error: "Dev session is only available from this machine. Set BOLTFY_API_KEY or paste a key." });
          return;
        }
        send(res, 200, { apiKey: devKey, apiUrl: base });
        return;
      }

      const ingest = pathName.match(/^\/api\/v1\/ingest\/([A-Za-z0-9_-]{8,80})$/);
      if (ingest && req.method === "GET") {
        send(res, 200, { ok: true, ingest: true, hint: "POST form fields or JSON to this URL." });
        return;
      }
      if (ingest && req.method === "POST") {
        const slug = ingest[1];
        const endpoint = await loadEndpoint(slug, base);
        if (!endpoint) {
          send(res, 404, { error: "This form no longer exists." });
          return;
        }
        if (tooMany(slug)) {
          send(res, 429, { error: "This form is receiving too many responses right now. Please try again in a minute." });
          return;
        }
        const bodyBuffer = await readBody(req);
        if (bodyBuffer.length > MAX_BODY) {
          send(res, 413, { error: "Your submission is too large." });
          return;
        }
        const raw = parsePayload(bodyBuffer, req.headers["content-type"]);
        const { honeypot, formId, payload } = cleanSubmission(raw, endpoint.fields);
        if (honeypot) {
          if (wantsHtml(req)) send(res, 200, thankYouHtml(), "text/html; charset=utf-8");
          else send(res, 200, { ok: true });
          return;
        }
        if (Object.keys(payload).length === 0) {
          send(res, 400, { error: "Your submission is empty." });
          return;
        }
        if (formId) payload._form = formId;
        const inserted = await pool.query(
          `INSERT INTO connect_submissions (id, endpoint_id, payload) VALUES ($1, $2, $3::jsonb) RETURNING id, created_at`,
          [randomUUID(), endpoint.id, JSON.stringify(payload)]
        );
        if (wantsHtml(req)) send(res, 200, thankYouHtml(), "text/html; charset=utf-8");
        else send(res, 201, { ok: true, id: inserted.rows[0].id, createdAt: inserted.rows[0].created_at });
        return;
      }

      const token = await authed(req);
      if (!token) {
        send(res, 401, { error: "Missing or unknown API key. Send Authorization: Bearer <key>." });
        return;
      }

      if (req.method === "GET" && pathName === "/api/v1/endpoints") {
        const result = await pool.query(
          `SELECT e.*, (SELECT count(*) FROM connect_submissions s WHERE s.endpoint_id = e.id) AS submission_count
           FROM connect_endpoints e ORDER BY created_at DESC`
        );
        send(res, 200, { endpoints: result.rows.map((row) => mapEndpoint(row, base)) });
        return;
      }

      if (req.method === "POST" && pathName === "/api/v1/endpoints") {
        const body = parsePayload(await readBody(req), req.headers["content-type"] || "application/json");
        const html = String(body.html ?? "");
        if (!html.trim()) {
          send(res, 422, { error: "Paste the HTML of the page first." });
          return;
        }
        if (html.length > MAX_HTML) {
          send(res, 413, { error: "That HTML page is too large." });
          return;
        }
        const slug = newSlug();
        const url = ingestUrl(base, slug);
        let prepared;
        try {
          prepared = prepareHtml(html, { ingestUrl: url, injectContact: Boolean(body.injectContact) });
        } catch (error) {
          send(res, error.status || 422, { error: error.message });
          return;
        }
        const name = String(body.name || prepared.title || "Website form").trim().slice(0, 120) || "Website form";
        const id = randomUUID();
        await pool.query(
          `INSERT INTO connect_endpoints (id, name, slug, source_html, rewritten_html, fields)
           VALUES ($1, $2, $3, $4, $5, $6::jsonb)`,
          [id, name, slug, html, prepared.rewrittenHtml, JSON.stringify(prepared.fields)]
        );
        const created = await loadEndpoint(slug, base);
        send(res, 201, created);
        return;
      }

      const one = pathName.match(/^\/api\/v1\/endpoints\/([A-Za-z0-9_-]{8,80})$/);
      if (one && req.method === "GET") {
        const endpoint = await loadEndpoint(one[1], base);
        if (!endpoint) {
          send(res, 404, { error: "Endpoint not found." });
          return;
        }
        send(res, 200, endpoint);
        return;
      }
      if (one && req.method === "DELETE") {
        const removed = await pool.query("DELETE FROM connect_endpoints WHERE slug = $1 RETURNING id", [one[1]]);
        if (removed.rowCount === 0) {
          send(res, 404, { error: "Endpoint not found." });
          return;
        }
        send(res, 200, { ok: true });
        return;
      }

      const submissions = pathName.match(/^\/api\/v1\/endpoints\/([A-Za-z0-9_-]{8,80})\/submissions$/);
      if (submissions && req.method === "GET") {
        const endpoint = await loadEndpoint(submissions[1], base);
        if (!endpoint) {
          send(res, 404, { error: "Endpoint not found." });
          return;
        }
        const limit = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") || 50)));
        const result = await pool.query(
          `SELECT id, payload, created_at FROM connect_submissions
           WHERE endpoint_id = $1 ORDER BY created_at DESC LIMIT $2`,
          [endpoint.id, limit]
        );
        send(res, 200, {
          submissions: result.rows.map((row) => ({ id: row.id, payload: row.payload, createdAt: row.created_at })),
        });
        return;
      }

      const test = pathName.match(/^\/api\/v1\/endpoints\/([A-Za-z0-9_-]{8,80})\/test$/);
      if (test && req.method === "POST") {
        const endpoint = await loadEndpoint(test[1], base);
        if (!endpoint) {
          send(res, 404, { error: "Endpoint not found." });
          return;
        }
        const payload = samplePayload(endpoint.fields);
        payload._form = "boltfy-test";
        const inserted = await pool.query(
          `INSERT INTO connect_submissions (id, endpoint_id, payload) VALUES ($1, $2, $3::jsonb) RETURNING id, created_at`,
          [randomUUID(), endpoint.id, JSON.stringify(payload)]
        );
        send(res, 201, { ok: true, id: inserted.rows[0].id, payload, createdAt: inserted.rows[0].created_at });
        return;
      }

      send(res, 404, { error: "Not found." });
    } catch (error) {
      const status = error.status || 500;
      if (status === 500) console.error(error);
      send(res, status, { error: status === 500 ? "Connect API failed." : error.message });
    }
  });

  await new Promise((resolve) => server.listen(port, "127.0.0.1", resolve));
  const address = server.address();
  const url = `http://127.0.0.1:${address.port}`;

  return {
    url,
    devKey,
    server,
    pool,
    close: async () => {
      await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
      await pool.end();
    },
  };
}
