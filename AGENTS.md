# Boltfy

Read `docs/platform.md` first. That is the explanation of how the platform works, for a person or an agent. The same page is served in the app at `/docs` and by the API at `GET /docs/platform.md`.

Boltfy is a form builder (Vite, React, Supabase) plus **Connect**: a backend for any HTML page.

Static sites fail at the form. Connect reads the HTML, rewrites each `<form>` to POST at Boltfy, and stores submissions where a person or an agent can read them.

## Connect, the path to exercise

1. Postgres on `127.0.0.1` as `postgres` / `postgres`.
2. `npm run connect` — API on port 8787. First boot writes `.boltfy/dev-key`.
3. `npm run dev` — UI on port 8080. Open `/connect`.
4. Paste HTML, or use the bakery sample. Create the endpoint. Send a test, or submit the preview iframe.
5. `GET /api/v1/endpoints/{slug}/submissions` with the bearer key returns the rows.

`npm run dev:stack` starts the API and Vite together.

Do not commit `.boltfy/` or `.env`.

## HTTP

| Action | Request |
|---|---|
| Health | `GET /health` |
| Contract | `GET /api/v1/openapi.json` |
| These notes, short | `GET /llms.txt` |
| Create from HTML | `POST /api/v1/endpoints` `{ "html", "name?", "injectContact?" }` |
| List | `GET /api/v1/endpoints` |
| One endpoint | `GET /api/v1/endpoints/{slug}` |
| Submissions | `GET /api/v1/endpoints/{slug}/submissions` |
| Sample row | `POST /api/v1/endpoints/{slug}/test` |
| Public ingest | `POST /api/v1/ingest/{slug}` |

Management routes need `Authorization: Bearer <key>`. Ingest is public so a static page can post without a key. The slug is unguessable. Set `Accept: application/json` for a JSON body; a normal browser form gets a thank-you page.

`injectContact: true` adds name, email, and message when the page has no `<form>`.

Unknown keys are dropped. Empty submissions are rejected. A non-empty `_boltfy_hp` is accepted and not stored. More than 60 posts a minute to one slug return 429.

`BOLTFY_PUBLIC_URL` is the origin written into rewritten HTML when the API is not on localhost. `BOLTFY_ALLOW_DEV_SESSION=0` turns off `GET /api/v1/dev/session`, which only answers on the loopback interface anyway.

## MCP

`.cursor/mcp.json` starts `node mcp/boltfy-server.mjs`. The server reads `BOLTFY_API_URL` (default `http://127.0.0.1:8787`) and `BOLTFY_API_KEY`, or `.boltfy/dev-key`.

Tools:

- `boltfy_connection`
- `boltfy_create_endpoint`
- `boltfy_list_endpoints`
- `boltfy_get_endpoint`
- `boltfy_list_submissions`
- `boltfy_test_endpoint`
- `boltfy_delete_endpoint`

Prove a connection by creating an endpoint, calling `boltfy_test_endpoint`, then `boltfy_list_submissions`. One row with `qa@boltfy.test` means the path works.

## Code map

- `server/html-forms.mjs` — parse fields, inject a contact form, rewrite `action`
- `server/app.mjs` — HTTP API and Postgres tables `connect_*`
- `server/index.mjs` — listen on 8787
- `mcp/boltfy-server.mjs` — stdio MCP
- `src/pages/Connect.tsx` — dashboard at `/connect`
- `src/` form builder, subscribers, and campaigns — the Supabase product. It needs `VITE_SUPABASE_*` in `.env`. Connect does not.

## Checks

```bash
npm test
npm run lint
npx tsc --noEmit -p tsconfig.app.json
PGHOST=127.0.0.1 PGUSER=postgres PGPASSWORD=postgres supabase/tests/run.sh
```

Connect tests use databases `boltfy_connect_test` and `boltfy_connect_mcp_test`. They create those databases if needed.
