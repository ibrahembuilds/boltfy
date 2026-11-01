# Changelog

## [Unreleased]

### Fixed (data and security)
- **Two customers could not have the same person on their lists.** `subscribers.email` was globally unique, so a newsletter signup failed (and the visitor's submission was lost) whenever the address was already on *any* other customer's list, and the error revealed that fact. Uniqueness is now per owner and addresses are normalised.
- **Every form's notification email and owner id were readable by anyone** with the public key. Anonymous visitors now get a safe projection through `get_public_form()`; the table itself is owner-only.
- **Anyone could unsubscribe anyone** (and test whether an address was subscribed) with just an email and an owner id. Links now carry a per-subscriber secret token.
- **User accounts could not be deleted** (the audit trigger referenced the user being deleted). Fixed, and the account deletion button in Settings now works.
- **Open email relay.** Any signed-in account could send arbitrary HTML to arbitrary recipients, as any `@boltfy.com` sender. The audience, From mailbox and links are now decided on the server; only the sender *name* is configurable.
- Form notification emails injected visitor-submitted text as raw HTML; they are escaped, read from the stored submission, sent at most once per submission and capped per form.
- `submit_public_form` no longer trusts a client flag to add subscribers; it validates payload size/keys and rate-limits per form.
- CSV export was open to spreadsheet formula injection and mis-quoted all but the last column.

### Fixed (things that didn't work or weren't true)
- Settings "Save" saved nothing, "Delete account" did nothing, and several toggles (including "Enhanced Data Protection / encryption") were wired to nothing. Rebuilt around settings that exist; fake "Pro Plan" badge removed.
- Dashboard "Responses" was capped at 5 and "Conversion" was an invented formula. Now real server-side counts; Conversion replaced by Active Subscribers.
- Per-form response counts only counted the latest 100 responses.
- The Subscribers page showed form responses, not subscribers. It now manages the real list (responses are a second tab).
- Saved campaign drafts could never be reopened or sent; "Send" reported success even with no email provider configured.
- Public form labels were not linked to their inputs (accessibility), and the honeypot's `id` could clash with a field.
- Template actions were unreachable on touch devices and delete had no confirmation; a "Preview" button did nothing.
- Slugs for non-Latin form names became empty strings and collided; duplicate slugs showed a raw database error.
- `form_submissions` was never added to the realtime publication, so "New response" toasts could not fire.

### Added
- Campaign drafts (edit / retry), test send, merge tags, confirmation dialog, delivery/failure reporting, batch sending with idempotency keys, `List-Unsubscribe` header, postal-address footer.
- Subscriber management: search, filter, pagination, add, CSV import (with consent), export, unsubscribe / resubscribe, delete.
- `ErrorBoundary`, per-route code splitting, vendor chunks.
- Tests: 77 Vitest unit tests and ~60 database assertions (RLS, RPCs, account deletion), both run in CI.

### Changed
- Initial JavaScript for a visitor dropped from 1.48 MB to 110 kB (entry chunk); PDF export code loads only when used.
- `AuthContext` no longer re-renders the whole app on every scroll/keypress.
- Removed unused `three`, `@react-three/fiber`, `@react-three/drei` dependencies.
- Untracked committed `__pycache__` / Vite temp files.
