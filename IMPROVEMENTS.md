# 🚀 Boltfy - Improvement Roadmap

## ✅ Current Features
- Dashboard with analytics (live, per-user data — no mock/hardcoded numbers)
- Subscriber management (CRUD), scoped per-user via RLS
- Custom form builder with drag-and-drop
- Public form embedding (`/f/:slug`, iframe embed mode via `?embed=true`)
- Email templates
- Campaigns management, with real delivery via Resend (server-side)
- Settings page
- Authentication (signup/login/Google OAuth/password reset), protected routes,
  per-user row-level security on every table
- Unsubscribe flow for campaign recipients

## ✅ Search and answer-engine pages
- [x] One canonical host (`https://boltfy.io`) for tags, sitemap, and robots
- [x] Prerendered HTML for public routes, plus `/llms.txt` and `/llms-full.txt`
- [x] FAQ, article, and organization structured data with no invented rating
- [x] Account, auth, unsubscribe, and public form URLs kept out of the index
- [x] Contact form sends through the `send-email` function

## ✅ Recently Fixed (Security & Correctness Hardening)
These were the platform's most serious gaps and are now resolved:
- [x] **Data isolation**: every table now has owner-scoped RLS
      (`supabase/migrations/20260711000000_secure_multitenant_rls.sql`).
      Previously all tables used `USING (true)` policies — any client with
      the public anon key could read/edit/delete *any* user's data.
- [x] **Email key exposure**: Resend was called directly from the browser
      with a `VITE_`-prefixed key, which ships into the client bundle.
      Sending now goes through the `send-email` Supabase Edge Function,
      where the key lives server-side only.
- [x] **Public form submission spoofing**: the client used to set
      `user_id` on submissions/subscribers itself — a malicious client could
      attribute data to any user. Public writes now go through a
      `SECURITY DEFINER` RPC (`submit_public_form`) that resolves the real
      owner server-side.
- [x] **Open-relay risk**: the form-notification email path resolves its
      recipient server-side from `form_id`, so the edge function can't be
      used to blast arbitrary addresses.
- [x] **Campaign sending was fully mocked** — "Send Campaign" just wrote a
      `status: 'sent'` row without emailing anyone, and there was no
      `/unsubscribe` route despite emails linking to one. Both now work.
- [x] Cross-tenant data leak in the Forms list (unscoped `custom_forms`
      query returned every user's forms, since that table is intentionally
      public-readable for the embed page).
- [x] `types.ts` was saved as UTF-16LE, which is not valid TS/JS source
      encoding — re-saved as UTF-8.
- [x] Anti-spam honeypot + submit-timing check on public forms.
- [x] `jspdf` upgraded off a version with critical CVEs (PDF export renders
      subscriber-submitted, i.e. untrusted, data).
- [x] CI (lint + typecheck + build) on every push/PR.

---

## 🎯 HIGH PRIORITY IMPROVEMENTS (still open)

### 1. 📊 Analytics depth
**What to add**:
- [ ] Campaign open/click tracking (requires a tracking pixel / link rewriting)
- [ ] Export reports to CSV/PDF

### 2. ⚡ Bundle size
**Why**: main JS chunk is ~1.5MB minified; `npm run build` warns about it
**What to add**:
- [ ] Route-level code splitting (`React.lazy`) for heavy pages
      (TemplateEditor, FormEditor pull in `three`/`@react-three/*`)
- [ ] `manualChunks` for vendor splitting

---

## 🎨 MEDIUM PRIORITY IMPROVEMENTS

### 5. 📝 Email Template Editor
**Current**: Basic template management
**Improvements**:
- [ ] Drag-and-drop email builder
- [ ] Pre-designed templates library
- [ ] Variables/placeholders ({subscriber.name})
- [ ] Preview on different devices
- [ ] HTML/code mode

### 6. 🏷️ Tags & Segments
**Why**: Better subscriber organization
**What to add**:
- [ ] Tag management
- [ ] Auto-tagging based on form source
- [ ] Segment builder (filters)
- [ ] Target campaigns by segment

### 7. 🤖 Automation Workflows
**Why**: Manual work for every action
**What to add**:
- [ ] Welcome email sequences
- [ ] Drip campaigns
- [ ] Trigger-based emails
- [ ] Workflow builder UI

### 8. 📱 Mobile Responsiveness
**Current**: Sidebar-based layout not mobile-friendly
**Improvements**:
- [ ] Mobile navigation (hamburger menu)
- [ ] Responsive form builder
- [ ] Touch-friendly drag-and-drop
- [ ] Mobile dashboard

---

## 💡 NICE TO HAVE IMPROVEMENTS

### 9. 🔌 Integrations
- [ ] Webhook support (send data on form submit)
- [ ] Zapier integration
- [ ] CRM integrations (HubSpot, Salesforce)
- [ ] Slack notifications

### 10. 🌍 Internationalization (i18n)
- [ ] Multi-language support
- [ ] RTL support
- [ ] Timezone handling

### 11. 🎨 More Form Features
- [ ] File upload fields
- [ ] Multi-step forms (wizard)
- [ ] Form logic (show/hide pages)
- [ ] Calculated fields
- [ ] Rating/star fields
- [ ] Signature field

### 12. 📈 A/B Testing
- [ ] Test different email subjects
- [ ] Test send times
- [ ] Landing page variants

### 13. 🔒 Security Enhancements
- [x] Rate limiting on form submissions (honeypot + submit-timing heuristic;
      see `src/pages/PublicForm.tsx`)
- [ ] CAPTCHA on forms (for more sophisticated bots than the honeypot catches)
- [ ] GDPR data-export/deletion self-service tools

---

## 🛠️ TECHNICAL IMPROVEMENTS

### 14. Code Quality
- [ ] Add unit tests (Vitest)
- [ ] Add E2E tests (Playwright)
- [ ] Error boundary components
- [ ] Better error messages

### 15. Performance
- [ ] Lazy loading for routes
- [ ] Image optimization
- [ ] Virtual scrolling for large lists
- [ ] Caching with React Query

### 16. Developer Experience
- [ ] Environment setup script
- [ ] Docker support
- [x] CI pipeline (`.github/workflows/ci.yml`: lint, typecheck, build)
- [ ] Expanded documentation (architecture deep-dive, RLS model)

---

## 📋 QUICK WINS (Can do today!)

1. **Add loading skeletons** - Better UX while loading
2. **Add empty states** - Guide users when no data
3. **Add keyboard shortcuts** - Power user features
4. ~~Add dark/light mode toggle~~ — done (`src/components/theme-provider.tsx` + `mode-toggle.tsx`, system/light/dark)
5. ~~Add export buttons~~ — done (Subscribers page: CSV + PDF export)
6. **Add confirmation dialogs** - Before delete actions
7. **Add form validation feedback** - Real-time validation
8. **Add success animations** - Celebrate actions

---

## 🗂️ Suggested Project Structure Update

```
src/
├── components/
│   ├── auth/           # NEW: Auth components
│   ├── common/         # NEW: Shared components
│   ├── dashboard/
│   ├── forms/
│   ├── email/          # NEW: Email-related
│   ├── layout/
│   └── ui/
├── features/           # NEW: Feature modules
│   ├── auth/
│   ├── campaigns/
│   ├── forms/
│   └── subscribers/
├── hooks/
├── lib/
│   ├── api/           # NEW: API utilities
│   ├── utils/
│   └── validators/    # NEW: Zod schemas
├── pages/
├── services/          # NEW: Business logic
│   ├── email.ts
│   └── analytics.ts
├── stores/            # NEW: State management
└── types/             # NEW: Shared types
```

---

## 🚦 Implementation Priority (remaining work)

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| 1 | Mobile responsive layout | Low | Medium |
| 2 | Bundle size / code splitting | Low | Medium |
| 3 | Tags/Segments | Medium | Medium |
| 4 | CAPTCHA on public forms | Low | Medium |
| 5 | Automation workflows | High | High |
| 6 | Unit/E2E test coverage | Medium | High |

~~Authentication~~, ~~public form pages~~, ~~email sending~~, ~~real
analytics~~, and ~~CSV/PDF export~~ (already in Subscribers) are done — see
"Current Features" and "Recently Fixed" above.
