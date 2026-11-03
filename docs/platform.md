# How Boltfy works

Boltfy collects form responses and shows them in one place.

There are two ways to use it.

## Build a form in Boltfy

You create the form inside Boltfy, share a link, and read the answers in your account. This part signs you in with Supabase.

1. Open the app and create a form.
2. Send people to `/f/your-link`.
3. Read the responses under Forms.

## Connect a page you already have

You already have a website made of HTML. The form on that page has nowhere to send its answers. Connect is the backend.

1. Open Connect.
2. Paste the HTML of the page.
3. Boltfy gives you one link.
4. Point the form at that link, or copy the HTML Boltfy rewrote. The rewritten page already posts to Boltfy.
5. When someone submits, the answer shows up on Connect.

If the page has no form, say so and Boltfy adds name, email, and message.

## What happens when someone submits

1. The browser sends the form to your Boltfy link.
2. Boltfy keeps the fields that were in the HTML. It drops anything else.
3. You see the row on Connect. An agent can read the same row through the API.

A normal browser sees a short Received page. A program that sends `Accept: application/json` gets JSON: `{ "ok": true, "id": "..." }`.

## What Boltfy refuses

- An empty submission.
- A field that was not on the form.
- A bot that fills the hidden field `_boltfy_hp`. Boltfy pretends it worked and does not save the row.
- More than 60 submissions to the same link in one minute.

The link is long and random. Anyone who has the link can post to it. That is what a public form is. Reading and creating links needs an API key.

## For an agent

Read this file first. The same words are on the site at `/docs`.

Then use:

- `llms.txt` for the short index
- `GET /api/v1/openapi.json` on the Connect API for the HTTP contract
- `GET /docs/platform.md` on the Connect API for this file as plain text
- MCP tools, when `npm run mcp` is running: `boltfy_create_endpoint`, `boltfy_test_endpoint`, `boltfy_list_submissions`

To prove the connection works:

1. Create an endpoint from a small HTML form.
2. Call the test tool.
3. List submissions.
4. You should see a row whose email is `qa@boltfy.test`.

Management calls send `Authorization: Bearer <key>`. After `npm run connect`, the key is in `.boltfy/dev-key`, or set `BOLTFY_API_KEY`. Do not paste the key into a chat log. The public form link does not use the key.

## Run it on your machine

Postgres must be running on `127.0.0.1` with user `postgres` and password `postgres`.

```
npm run connect
npm run dev
```

Open `http://127.0.0.1:8080/connect` to paste a page. Open `http://127.0.0.1:8080/docs` to read this guide.

`npm run dev:stack` starts the API and the site together. `npm run mcp` starts the agent server. Cursor loads it from `.cursor/mcp.json`.

## Where the code lives

- `docs/platform.md` is this guide
- `server/html-forms.mjs` reads the HTML and rewrites the form
- `server/app.mjs` is the API and the database
- `src/pages/Connect.tsx` is the screen you paste into
- `src/pages/Docs.tsx` is this guide in the app
- `mcp/boltfy-server.mjs` is the agent tools
