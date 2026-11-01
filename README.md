# ⚡ Boltfy

**Boltfy** is a form builder with a built-in mailing list: build a form, share or embed it, collect responses, turn sign-ups into subscribers, and email them campaigns. Built with Vite, React, TypeScript and Tailwind, on Supabase (Postgres + Auth + Edge Functions) with Resend for delivery.

---

## ✨ What works

| Area | What you get |
|---|---|
| **Forms** | Drag-and-drop builder, styling, shareable link (`/f/:slug`) and iframe embed (`?embed=true`). Honeypot + timing check client-side, and a server-side flood limit (60 responses/min/form). |
| **Responses** | Per-form counts and a live "new response" feed, search, CSV and PDF export. CSV is safe to open in Excel/Sheets (formula injection is neutralised). |
| **Subscribers** | Search, filter, paginate, add by hand, **import CSV** (with a consent confirmation), export, mark unsubscribed / resubscribe, delete. Newsletter forms add people automatically. |
| **Campaigns** | Drafts you can edit and resend, **test send to yourself**, `{{first_name}}` merge tags, confirmation before sending, delivery counts and error reporting. Sent in batches from the server. |
| **Unsubscribe** | Per-subscriber secret link and `List-Unsubscribe` header; the unsubscribe happens on a button click (not on page load, so mail scanners can't unsubscribe people). |
| **Settings** | Real, saved: profile name, sender name, reply-to address, postal address (printed in every campaign footer), and self-service **account deletion**. |
| **Multi-tenant security** | Row Level Security on every table; the public only ever sees a safe projection of a form; all of this is covered by database tests (see below). |

Not built yet: email templates inside campaigns (the Templates page is separate), open/click tracking, scheduled sends, double opt-in, bounce/complaint handling. See [`IMPROVEMENTS.md`](IMPROVEMENTS.md) for an honest list.

> `ai-commerce-agent/` is an unrelated Python prototype that happens to live in this repository. It isn't used by Boltfy.

---

## 🏗️ Layout

```
boltfy/
├── src/
│   ├── components/        # ui/ (shadcn), forms/, subscribers/, layout/, dashboard/, templates/
│   ├── contexts/          # AuthContext
│   ├── integrations/      # Supabase client + DB types
│   ├── lib/               # csv.ts, slug.ts, email.ts (client for the edge function), security.ts
│   └── pages/             # one lazy-loaded chunk per route (see App.tsx)
├── supabase/
│   ├── migrations/        # ordered SQL: schema, RLS, RPCs (never edit a shipped one; add a new file)
│   ├── functions/
│   │   ├── send-email/    # campaigns, test sends, form notifications (holds the Resend key)
│   │   ├── delete-account/
│   │   └── _shared/       # pure helpers, unit-tested with Vitest
│   └── tests/             # SQL tests for RLS/RPCs, run against a real Postgres
└── .github/workflows/ci.yml
```

---

## ⚙️ Configuration

### Frontend (`.env`)

```env
VITE_SUPABASE_URL="https://your-project-id.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="your-anon-or-publishable-key"
VITE_SUPABASE_PROJECT_ID="your-project-id"
```

### Edge function secrets (server-side only, never `VITE_`)

```bash
supabase secrets set RESEND_API_KEY=re_xxx
supabase secrets set APP_URL=https://your-domain.com          # used in unsubscribe / dashboard links
supabase secrets set EMAIL_FROM="Boltfy <noreply@your-domain.com>"   # optional; domain must be verified in Resend
```

Without `RESEND_API_KEY` the functions run in **dry-run** mode: nothing is delivered and the app tells you so (it no longer reports success).

---

## 🚀 Deploying (order matters)

The frontend and the database changes depend on each other, so do these back-to-back:

1. **Database:** `supabase link --project-ref <ref>` then `supabase db push`
2. **Functions:** `supabase functions deploy send-email` and `supabase functions deploy delete-account`, and set the secrets above
3. **Frontend:** deploy to Vercel/Netlify (`npm run build`, output `dist/`, with the `VITE_*` variables)

Between steps 1 and 3 a browser still running the *old* frontend can't load public forms (they are no longer readable from the table; the new frontend uses `get_public_form`) and can't send campaigns (the old open-relay `campaign` action is gone). That window is intentional; keep it short.

`20261101000000_platform_hardening.sql` keeps already-delivered unsubscribe links (`?owner=&email=`) working through a legacy function. Once those emails are old, drop it: `DROP FUNCTION public.unsubscribe_email(TEXT, UUID);`.

---

## 💻 Local development

```bash
npm install
cp .env.example .env     # fill in your Supabase values
npm run dev              # http://localhost:8080
```

---

## ✅ Tests and CI

```bash
npm run lint
npx tsc --noEmit -p tsconfig.app.json
npm test                 # Vitest: CSV, slugs, and the email-building helpers
npm run build

# Database: applies every migration to a throw-away Postgres and runs ~60 RLS/RPC assertions.
# Needs a Postgres superuser connection (CI uses a service container):
PGHOST=127.0.0.1 PGUSER=postgres PGPASSWORD=postgres supabase/tests/run.sh
```

CI (`.github/workflows/ci.yml`) runs all of the above on every push and pull request.

What is **not** automatically tested: the edge-function handlers themselves (they run on Deno inside Supabase and call Resend; only their pure helpers are unit-tested) and end-to-end flows against a live Supabase project. Send yourself a **test campaign** after deploying to check your Resend setup.

---

## 🤝 Contributing

1. Fork and branch: `git checkout -b feature/awesome-feature`
2. Run the checks above before opening a PR
3. Schema changes go in a **new** migration file with a test in `supabase/tests/platform.test.sql`
