# ⚡ Boltfy Form Builder

**Boltfy** is a modern, premium, drag-and-drop form builder that allows creators and businesses to build beautiful forms, manage subscribers, orchestrate email campaigns, and track real-time analytics. Built with Vite, React, TypeScript, Tailwind CSS, and powered by Supabase.

---

## ✨ Features

- **📊 Dashboard Analytics**: View real-time form submissions, response rates, and conversion metrics.
- **📝 Drag & Drop Form Builder**: Add, edit, remove, and reorder fields (text inputs, textareas, checkboxes, buttons, etc.).
- **🔐 Secure Authentication**: Integrated user registration, login, and secure session management powered by Supabase Auth.
- **🏷️ Subscriber Management**: CRUD operations for form respondents, categorizing them as active or unsubscribed.
- **📧 Campaigns & Broadcasts**: Compose and send newsletters/broadcasts directly to active subscribers.
- **🎨 Email Templates Editor**: Design responsive email layouts using a drag-and-drop builder with predefined content blocks.
- **🖥️ Responsive Layout**: Sidebar navigation collapses cleanly, adapting layouts perfectly for both desktop and mobile viewports.

---

## 🏗️ Architecture & Directory Structure

```
form-flow-main/
├── src/
│   ├── components/       # Reusable components
│   │   ├── auth/         # Login, Signup, ProtectedRoute components
│   │   ├── dashboard/    # Analytics charts and summaries
│   │   ├── forms/        # Form editors and preview panels
│   │   ├── layout/       # Sidebar, Footer, Header, BrandLogo, and SEO wrappers
│   │   ├── templates/    # Email builder drag-and-drop block editors
│   │   └── ui/           # Radix-ui + Shadcn primitive UI widgets
│   ├── contexts/         # React Contexts (AuthContext for user state)
│   ├── hooks/            # Custom hooks (e.g. use-toast)
│   ├── integrations/     # Third-party API client hooks (Supabase type declarations)
│   ├── lib/              # Utility helper libraries (cn, security checks)
│   ├── pages/            # Application screens (routed in App.tsx)
│   ├── App.tsx           # Router layout and global context providers
│   └── main.tsx          # Application entrypoint
├── supabase/
│   ├── migrations/       # Ordered SQL: schema, RLS policies, RPCs
│   └── functions/
│       └── send-email/   # Edge Function — holds the Resend key server-side
├── index.html            # Core HTML template with SEO configurations
├── tailwind.config.ts    # Design tokens, colors, transitions
└── vite.config.ts        # Bundler configuration
```

---

## ⚙️ Environment Configuration

Create a `.env` file in the root of the project with the following environment variables:

```env
# Supabase Configuration
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"

# App URL Configuration
VITE_APP_URL="http://localhost:8081" # Or your production domain
```

Email is sent from a Supabase Edge Function, not the browser, so the Resend
key is a **server-side secret** rather than a `VITE_` var — see
[Email Sending](#-email-sending) below.

---

## 🗄️ Database Setup (Supabase)

All schema, RLS policies, and functions live in `supabase/migrations/` as
ordered SQL files — there is no separate manual setup script to run. Apply
them with the Supabase CLI:

```bash
supabase link --project-ref your-project-id
supabase db push
```

This creates the multi-tenant tables (`custom_forms`, `form_submissions`,
`subscribers`, `campaigns`, `email_templates`, `audit_logs`) with row-level
security scoped per-user, plus two RPCs (`submit_public_form`,
`unsubscribe_email`) that let anonymous visitors submit forms and unsubscribe
without ever being trusted with another user's data.

### 📧 Email Sending

Campaign emails and form-submission notifications are sent by the
`send-email` Edge Function in `supabase/functions/send-email/`. Deploy it and
set the Resend key as a secret (never as a `VITE_` variable — that would ship
the key into the browser bundle):

```bash
supabase functions deploy send-email
supabase secrets set RESEND_API_KEY=your-resend-api-key
```

Without a configured key, the function logs the email instead of sending it —
useful for local development.

---

## 🚀 Local Development Setup

Follow these steps to run the application locally:

### 1. Clone the project
```bash
git clone git@github.com:hemoyt/boltfy.git
cd boltfy
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start development server
```bash
npm run dev
```
The application will launch on your configured local port (typically `http://localhost:8080` or `http://localhost:8081`).

---

## 📦 Production Build & Deployment

To prepare the application for production deployment:

```bash
npm run build
```
This builds and compiles static assets into the `/dist` directory.

### ☁️ Deploying to Vercel / Netlify

1. Connect your GitHub repository to Vercel/Netlify.
2. Set the build command to `npm run build` and output directory to `dist`.
3. Add your environment variables (VITE_SUPABASE_URL, etc.) in the platform dashboard.
4. Deploy!

### Search and answer engines

The canonical host is `https://boltfy.io`. `npm run build` prerenders the public
pages (home, about, guides, contact, privacy, terms) so a crawler that does
not run JavaScript still receives the title, canonical URL, JSON-LD, and the
page text. It also writes:

- `/sitemap.xml`
- `/robots.txt` — account, auth, unsubscribe, and `/f/` URLs are disallowed
- `/llms.txt` — short map for answer engines
- `/llms-full.txt` — the FAQ, about page, and guides in one Markdown file

`npm run seo:check` asserts those files after a build. Do not put a review
rating in the structured data unless it comes from real, visible reviews.

---

## ✅ Testing & CI

There's no automated test suite yet (see `IMPROVEMENTS.md`), but every push
and PR runs through `.github/workflows/ci.yml`:

```bash
npm run lint
npx tsc --noEmit -p tsconfig.app.json
npm run build
```

Run the same three commands locally before opening a PR.

---

## 🤝 Contribution Guidelines
1. Fork the repository.
2. Create a new branch: `git checkout -b feature/awesome-feature`.
3. Make changes and run `npm run lint && npx tsc --noEmit -p tsconfig.app.json`.
4. Commit and push: `git push origin feature/awesome-feature`.
5. Open a Pull Request.
