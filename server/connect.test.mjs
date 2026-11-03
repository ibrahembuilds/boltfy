import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { SAMPLE_LANDING_HTML } from "./html-forms.mjs";
import { startConnectServer } from "./app.mjs";

const databaseUrl = process.env.CONNECT_TEST_DATABASE_URL
  || "postgres://postgres:postgres@127.0.0.1:5432/boltfy_connect_test";

let api;

async function call(path, { method = "GET", key, body, headers = {}, form = false } = {}) {
  const init = { method, headers: { ...headers } };
  if (key) init.headers.Authorization = `Bearer ${key}`;
  if (body != null && !form) {
    init.headers["Content-Type"] = "application/json";
    init.headers.Accept = "application/json";
    init.body = JSON.stringify(body);
  }
  if (form) {
    init.headers["Content-Type"] = "application/x-www-form-urlencoded";
    init.headers.Accept = "application/json";
    init.body = new URLSearchParams(body).toString();
  }
  const response = await fetch(`${api.url}${path}`, init);
  const text = await response.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { json = { raw: text }; }
  return { status: response.status, json, text };
}

beforeAll(async () => {
  api = await startConnectServer({
    databaseUrl,
    persistDevKey: false,
    allowDevSession: true,
    rateLimit: 3,
  });
  await api.pool.query("TRUNCATE connect_submissions, connect_endpoints, connect_api_keys CASCADE");
  // The key created at boot was just deleted. Insert it again.
  const { hashToken } = await import("./app.mjs");
  await api.pool.query(
    "INSERT INTO connect_api_keys (id, name, token_hash, token_prefix) VALUES (gen_random_uuid(), 'test', $1, $2)",
    [hashToken(api.devKey), api.devKey.slice(0, 12)]
  );
});

afterAll(async () => {
  if (api) await api.close();
});

describe("connect API", () => {
  it("turns a landing page into an ingest URL and stores only known fields", async () => {
    const health = await call("/health");
    expect(health.json.service).toBe("boltfy-connect");

    const guide = await fetch(`${api.url}/docs/platform.md`);
    expect(guide.status).toBe(200);
    expect(await guide.text()).toContain("# How Boltfy works");

    const session = await call("/api/v1/dev/session");
    expect(session.json.apiKey).toBe(api.devKey);

    const created = await call("/api/v1/endpoints", {
      method: "POST",
      key: api.devKey,
      body: { html: SAMPLE_LANDING_HTML, name: "Northwind" },
    });
    expect(created.status).toBe(201);
    expect(created.json.fields.map((field) => field.name)).toEqual(["customer", "email", "guests", "cake", "notes"]);
    expect(created.json.rewrittenHtml).toContain(created.json.ingestUrl);
    expect(created.json.curl).toContain("Accept: application/json");

    const posted = await call(`/api/v1/ingest/${created.json.slug}`, {
      method: "POST",
      form: true,
      body: {
        customer: "Ada",
        email: "ada@northwind.test",
        cake: "vanilla",
        notes: "Lemon, Saturday",
        password: "should-not-stick",
      },
    });
    expect(posted.status).toBe(201);
    expect(posted.json.ok).toBe(true);

    const listed = await call(`/api/v1/endpoints/${created.json.slug}/submissions`, { key: api.devKey });
    expect(listed.json.submissions).toHaveLength(1);
    expect(listed.json.submissions[0].payload).toMatchObject({
      customer: "Ada",
      email: "ada@northwind.test",
      cake: "vanilla",
      notes: "Lemon, Saturday",
    });
    expect(listed.json.submissions[0].payload.password).toBeUndefined();

    const spam = await call(`/api/v1/ingest/${created.json.slug}`, {
      method: "POST",
      form: true,
      body: { email: "bot@spam.test", _boltfy_hp: "http://spam.test" },
    });
    expect(spam.status).toBe(200);
    const afterSpam = await call(`/api/v1/endpoints/${created.json.slug}/submissions`, { key: api.devKey });
    expect(afterSpam.json.submissions).toHaveLength(1);

    const empty = await call(`/api/v1/ingest/${created.json.slug}`, {
      method: "POST",
      form: true,
      body: { not_a_field: "x" },
    });
    expect(empty.status).toBe(400);

    const tested = await call(`/api/v1/endpoints/${created.json.slug}/test`, { method: "POST", key: api.devKey });
    expect(tested.status).toBe(201);
    expect(tested.json.payload.email).toBe("qa@boltfy.test");

    const removed = await call(`/api/v1/endpoints/${created.json.slug}`, { method: "DELETE", key: api.devKey });
    expect(removed.json.ok).toBe(true);
    const gone = await call(`/api/v1/ingest/${created.json.slug}`, { method: "POST", form: true, body: { email: "a@b.co" } });
    expect(gone.status).toBe(404);
  });

  it("adds a contact form to a page that has none", async () => {
    const created = await call("/api/v1/endpoints", {
      method: "POST",
      key: api.devKey,
      body: { html: "<html><body><h1>Studio</h1></body></html>", injectContact: true },
    });
    expect(created.status).toBe(201);
    expect(created.json.fields.map((field) => field.name)).toEqual(["name", "email", "message"]);
  });

  it("rejects a brochure page with no form", async () => {
    const created = await call("/api/v1/endpoints", {
      method: "POST",
      key: api.devKey,
      body: { html: "<p>No form here</p>" },
    });
    expect(created.status).toBe(422);
  });

  it("requires an API key for the dashboard and rate-limits a public ingest", async () => {
    const hidden = await call("/api/v1/endpoints");
    expect(hidden.status).toBe(401);

    const created = await call("/api/v1/endpoints", {
      method: "POST",
      key: api.devKey,
      body: { html: `<form><input name="email" type="email"></form>` },
    });
    const slug = created.json.slug;
    const statuses = [];
    for (let i = 0; i < 4; i += 1) {
      const response = await call(`/api/v1/ingest/${slug}`, { method: "POST", form: true, body: { email: `p${i}@t.co` } });
      statuses.push(response.status);
    }
    expect(statuses.slice(0, 3)).toEqual([201, 201, 201]);
    expect(statuses[3]).toBe(429);
  });
});
