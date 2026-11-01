# 🚀 Boltfy — Status and Roadmap

Last reviewed against the code, not against earlier versions of this file. Items are only ticked if they work end-to-end *and* are covered by a test or were exercised in a browser.

## ✅ Working today

- Auth (email/password, Google OAuth, password reset), protected routes, 30-min inactivity sign-out
- Form builder, public form page, iframe embed, per-form notification email
- Responses: live feed, per-form counts, search, CSV + PDF export (formula-injection safe)
- Subscribers: real list management, CSV import/export, unsubscribe/resubscribe, newsletter forms add subscribers automatically
- Campaigns: drafts, test send, merge tags, confirm-before-send, batch delivery, failure reporting, unsubscribe links, postal-address footer
- Settings: profile, sender name / reply-to / postal address, account deletion
- Row Level Security on every table, tested against a real Postgres in CI
- Dashboard with real, server-side numbers

## ⚠️ Known gaps (be aware before relying on them)

| Gap | Why it matters |
|---|---|
| **Edge functions are not integration-tested.** Only their pure helpers are. They type-check under Deno, but nothing in CI runs them against Supabase/Resend. | Send a **test campaign** after every deploy. |
| **Large campaigns are limited by the function's wall-clock time.** A single send stops starting new batches after ~110 s (≈ a few thousand recipients, because Resend allows ~2 requests/s) and marks the campaign `failed` with a "send again to continue" message. Batches use idempotency keys so a retry should not re-deliver finished batches; that relies on Resend honouring the header and has not been verified. | For big lists, move sending to a queue (e.g. `pg_cron` + a worker). |
| **No double opt-in.** Anyone can type another person's address into a newsletter form. | Hurts list quality and deliverability; some jurisdictions expect confirmation. |
| **No bounce / complaint handling.** Hard bounces and spam complaints keep getting mailed. | Resend webhooks → mark subscribers `unsubscribed`/`bounced`. |
| **Templates are an island.** You can create and delete templates but not edit them, and campaigns can't use them. | Wire "start from template" into Compose; add `/templates/:id`. |
| **No open/click tracking.** `campaigns.open_rate` exists but is never filled; the UI doesn't show it. | Needs a tracking pixel / link redirect function. |
| **No true "conversion" metric.** Needs form-view counting. | Add a `record_form_view` RPC and a counter. |
| **Rate limits on login/signup are client-side only** (`security.ts`). | They deter nobody who scripts the API; Supabase's own auth rate limits apply. |
| **One-click `List-Unsubscribe-Post`** is not implemented (only the `List-Unsubscribe` link). | Required by Gmail/Yahoo for bulk senders (>5k/day). |
| `ai-commerce-agent/` is an unrelated project living in this repo. | Move it out when convenient. |

## 🎯 Next up (suggested order)

1. Wire templates into campaigns; add template editing
2. Resend webhooks for bounces/complaints
3. Double opt-in for newsletter forms (`subscribers.status = 'pending'` already exists)
4. Queue-based sending + scheduled campaigns (`campaigns.status = 'scheduled'` already exists)
5. Tags / segments
6. Playwright E2E run against a local Supabase (`supabase start`) in CI

## 💡 Later

Webhooks/Zapier on submit, file-upload and multi-step form fields, form logic, i18n/RTL, A/B subject tests, CAPTCHA, GDPR data export.

## ❌ Correction to earlier notes

Earlier versions of this file said the main bundle was heavy because `TemplateEditor`/`FormEditor` "pull in `three`/`@react-three/*`". That was wrong: nothing in `src/` imported them. They have been removed from `package.json`. The real bundle fix was per-route code splitting (entry chunk 1.48 MB → 110 kB) and loading jsPDF only when exporting a PDF.
