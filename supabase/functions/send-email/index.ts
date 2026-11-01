// Supabase Edge Function: send-email
//
// The Resend key lives here (`supabase secrets set RESEND_API_KEY=...`) and
// never reaches the browser. Every action is built so that the CALLER CANNOT
// CHOOSE WHO GETS MAIL OR WHO IT APPEARS TO COME FROM:
//
//  - "send-campaign"  (signed-in)  { campaignId }
//        The audience is the caller's own *active* subscribers, read here
//        with the service role. Unsubscribe links, the From mailbox and the
//        footer are added here. (The previous "campaign" action accepted
//        arbitrary to/from/html from any account, i.e. an open relay that
//        could send as anything@boltfy.com.)
//
//  - "test-campaign"  (signed-in)  { subject, content }
//        Sends a preview to the caller's own login address only.
//
//  - "form-notification"  (anonymous)  { submissionId }
//        Emails the form owner about a submission that already exists in the
//        database, once, shortly after it was made. The content is read from
//        the stored row, never from the request, so the endpoint cannot be
//        used to push arbitrary text into an owner's inbox.
//
// Secrets / env:
//   RESEND_API_KEY   required to actually send; without it the function runs
//                    in dry-run mode and says so ({ dryRun: true }).
//   EMAIL_FROM       optional, default "Boltfy <noreply@boltfy.com>" (must be
//                    on a domain verified in Resend).
//   APP_URL          public URL of the web app, used in links. Falls back to
//                    the request's Origin header.
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import {
  applyMergeTags,
  buildFrom,
  buildUnsubscribeUrl,
  chunk,
  contentToHtml,
  describeResendError,
  isValidEmail,
  renderCampaignHtml,
  renderFormNotificationHtml,
  retryDelayMs,
  submissionRows,
} from "../_shared/email.ts";
import { corsHeaders, json, sleep, UUID_RE } from "../_shared/http.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const PLATFORM_FROM = Deno.env.get("EMAIL_FROM") || "Boltfy <noreply@boltfy.com>";
const APP_URL = Deno.env.get("APP_URL");

const BATCH_SIZE = 100; // Resend's batch endpoint maximum
const BATCH_PAUSE_MS = 600; // Resend's default limit is 2 requests/second
const SEND_DEADLINE_MS = 110_000; // stop starting batches well inside the function's wall-clock limit
const STALE_SENDING_MS = 15 * 60 * 1000; // a campaign stuck in "sending" this long may be retried
const MAX_SUBJECT = 200;
const MAX_CONTENT = 100_000;
const MAX_RECIPIENTS = 10_000;
const NOTIFY_WINDOW_MS = 10 * 60 * 1000; // a submission can only trigger a notification this soon after it was made
const NOTIFY_HOURLY_CAP = 20; // per form, so a flood of responses cannot flood the owner's inbox

type Admin = SupabaseClient;

interface OutgoingEmail {
  from: string;
  to: string[];
  subject: string;
  html: string;
  reply_to?: string;
  headers?: Record<string, string>;
}

// ---------------------------------------------------------------- Resend

async function resendRequest(
  path: string,
  body: unknown,
  idempotencyKey?: string,
): Promise<{ ok: boolean; status: number; data: unknown }> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`https://api.resend.com${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => null);
    const retryable = res.status === 429 || res.status >= 500;
    if (res.ok || !retryable || attempt >= 3) return { ok: res.ok, status: res.status, data };
    await sleep(retryDelayMs(attempt, res.headers.get("retry-after")));
  }
}

/** Send one transactional email. */
async function sendOne(email: OutgoingEmail): Promise<{ success: boolean; dryRun?: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.log("[send-email] RESEND_API_KEY not set - dry run:", email.subject, "->", email.to.length, "recipient(s)");
    return { success: true, dryRun: true };
  }
  const res = await resendRequest("/emails", email);
  return res.ok ? { success: true } : { success: false, error: describeResendError(res.data, res.status) };
}

/** Send up to 100 emails in one API call. All-or-nothing per batch. */
async function sendBatch(
  emails: OutgoingEmail[],
  idempotencyKey: string,
): Promise<{ success: boolean; dryRun?: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.log("[send-email] RESEND_API_KEY not set - dry run: batch of", emails.length);
    return { success: true, dryRun: true };
  }
  const res = await resendRequest("/emails/batch", emails, idempotencyKey);
  return res.ok ? { success: true } : { success: false, error: describeResendError(res.data, res.status) };
}

// ---------------------------------------------------------------- helpers

async function authenticate(req: Request, admin: Admin) {
  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  if (!jwt) return null;
  const { data, error } = await admin.auth.getUser(jwt);
  return error || !data?.user ? null : data.user;
}

function appUrl(req: Request): string {
  return (APP_URL || req.headers.get("origin") || "").replace(/\/+$/, "");
}

async function loadSettings(admin: Admin, userId: string) {
  const { data } = await admin
    .from("user_settings")
    .select("sender_name, reply_to_email, postal_address")
    .eq("user_id", userId)
    .maybeSingle();
  return (data ?? {}) as { sender_name?: string | null; reply_to_email?: string | null; postal_address?: string | null };
}

function unlistedHeaders(unsubscribeUrl: string): Record<string, string> {
  return { "List-Unsubscribe": `<${unsubscribeUrl}>` };
}

// ---------------------------------------------------------------- actions

async function testCampaign(req: Request, admin: Admin, body: Record<string, unknown>) {
  const user = await authenticate(req, admin);
  if (!user || !user.email) return json({ error: "Unauthorized" }, 401);

  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const content = typeof body.content === "string" ? body.content : "";
  if (!subject || !content.trim()) return json({ error: "Subject and content are required." }, 400);
  if (subject.length > MAX_SUBJECT || content.length > MAX_CONTENT) return json({ error: "Subject or content is too long." }, 400);

  const base = appUrl(req);
  if (!base) return json({ error: "APP_URL is not configured." }, 500);

  const settings = await loadSettings(admin, user.id);
  const html = renderCampaignHtml({
    bodyHtml: applyMergeTags(contentToHtml(content), { name: settings.sender_name, email: user.email }),
    unsubscribeUrl: `${base}/unsubscribe?token=preview`,
    logoUrl: `${base}/icon.png`,
    subject,
    senderName: settings.sender_name,
    postalAddress: settings.postal_address,
  });

  const result = await sendOne({
    from: buildFrom(settings.sender_name, PLATFORM_FROM),
    to: [user.email],
    subject: `[Test] ${subject}`,
    html,
    reply_to: settings.reply_to_email || user.email,
  });
  return json({ ...result, sentTo: user.email }, result.success ? 200 : 502);
}

async function sendCampaign(req: Request, admin: Admin, body: Record<string, unknown>) {
  const user = await authenticate(req, admin);
  if (!user) return json({ error: "Unauthorized" }, 401);

  const campaignId = body.campaignId;
  if (typeof campaignId !== "string" || !UUID_RE.test(campaignId)) return json({ error: "Invalid campaignId." }, 400);

  const base = appUrl(req);
  if (!base) return json({ error: "APP_URL is not configured." }, 500);

  // Atomically claim the campaign so a double click / second tab cannot send it twice.
  const staleBefore = new Date(Date.now() - STALE_SENDING_MS).toISOString();
  const { data: campaign } = await admin
    .from("campaigns")
    .update({ status: "sending", last_error: null, failed_count: 0 })
    .eq("id", campaignId)
    .eq("user_id", user.id)
    .or(`status.in.(draft,failed),and(status.eq.sending,updated_at.lt.${staleBefore})`)
    .select("id, subject, content")
    .maybeSingle();

  if (!campaign) {
    const { data: existing } = await admin.from("campaigns").select("status").eq("id", campaignId).eq("user_id", user.id).maybeSingle();
    if (!existing) return json({ error: "Campaign not found." }, 404);
    return json({ error: `This campaign is already ${existing.status}.` }, 409);
  }

  const release = (status: "draft" | "failed", lastError: string) =>
    admin.from("campaigns").update({ status, last_error: lastError }).eq("id", campaign.id);

  try {
    const subject = String(campaign.subject ?? "").trim();
    const content = String(campaign.content ?? "");
    if (!subject || !content.trim()) {
      await release("draft", "Subject and content are required.");
      return json({ error: "Subject and content are required." }, 400);
    }
    if (subject.length > MAX_SUBJECT || content.length > MAX_CONTENT) {
      await release("draft", "Subject or content is too long.");
      return json({ error: "Subject or content is too long." }, 400);
    }

    // Audience: this account's active subscribers, nobody else.
    const recipients: { email: string; name: string | null; unsubscribe_token: string }[] = [];
    for (let from = 0; recipients.length < MAX_RECIPIENTS; from += 1000) {
      const { data, error } = await admin
        .from("subscribers")
        .select("email, name, unsubscribe_token")
        .eq("user_id", user.id)
        .eq("status", "active")
        .order("created_at")
        .order("id")
        .range(from, from + 999);
      if (error) throw error;
      for (const s of data ?? []) if (isValidEmail(s.email)) recipients.push(s);
      if (!data || data.length < 1000) break;
    }

    if (recipients.length === 0) {
      await release("draft", "You have no active subscribers.");
      return json({ error: "You have no active subscribers." }, 400);
    }

    const settings = await loadSettings(admin, user.id);
    const from = buildFrom(settings.sender_name, PLATFORM_FROM);
    const replyTo = settings.reply_to_email || user.email || undefined;
    const bodyTemplate = contentToHtml(content);
    const logoUrl = `${base}/icon.png`;

    const emails: OutgoingEmail[] = recipients.map((r) => {
      const unsubscribeUrl = buildUnsubscribeUrl(base, r.unsubscribe_token);
      return {
        from,
        to: [r.email],
        subject,
        html: renderCampaignHtml({
          bodyHtml: applyMergeTags(bodyTemplate, r),
          unsubscribeUrl,
          logoUrl,
          subject,
          senderName: settings.sender_name,
          postalAddress: settings.postal_address,
        }),
        reply_to: replyTo,
        headers: unlistedHeaders(unsubscribeUrl),
      };
    });

    // Deterministic batches + Idempotency-Key: if this campaign is retried
    // within Resend's idempotency window, batches that already went out are
    // not delivered a second time.
    const batches = chunk(emails, BATCH_SIZE);
    const started = Date.now();
    let delivered = 0;
    let failed = 0;
    let dryRun = false;
    let timedOut = false;
    let firstError: string | null = null;

    for (let i = 0; i < batches.length; i++) {
      if (Date.now() - started > SEND_DEADLINE_MS) {
        timedOut = true;
        failed += batches.slice(i).reduce((n, b) => n + b.length, 0);
        break;
      }
      const result = await sendBatch(batches[i], `campaign-${campaign.id}-batch-${i}`);
      if (result.success) {
        delivered += batches[i].length;
        dryRun ||= !!result.dryRun;
      } else {
        failed += batches[i].length;
        firstError ??= result.error ?? "Unknown error";
      }
      if (i < batches.length - 1 && !dryRun) await sleep(BATCH_PAUSE_MS);
    }

    // Dry run (no RESEND_API_KEY): nothing was delivered, so do not record the
    // campaign as sent. Put it back to a draft that explains why.
    if (dryRun) {
      const note = "Dry run: RESEND_API_KEY is not configured on the server, so nothing was delivered.";
      await admin
        .from("campaigns")
        .update({ status: "draft", recipients_count: 0, failed_count: 0, last_error: note, sent_at: null })
        .eq("id", campaign.id);
      return json({ success: false, dryRun: true, status: "draft", delivered: 0, failed: 0, total: emails.length, error: note });
    }

    const status = timedOut || delivered === 0 ? "failed" : "sent";
    const lastError = timedOut
      ? `Stopped after ${delivered} of ${emails.length} recipients (time limit). Send again to continue.`
      : firstError;

    await admin
      .from("campaigns")
      .update({
        status,
        recipients_count: delivered,
        failed_count: failed,
        last_error: lastError,
        sent_at: delivered > 0 ? new Date().toISOString() : null,
      })
      .eq("id", campaign.id);

    return json({ success: delivered > 0, status, delivered, failed, total: emails.length, dryRun, timedOut, error: lastError });
  } catch (err) {
    console.error("[send-email] send-campaign error", err);
    await release("failed", err instanceof Error ? err.message : String(err));
    return json({ error: "Could not send the campaign. Please try again." }, 500);
  }
}

async function formNotification(req: Request, admin: Admin, body: Record<string, unknown>) {
  const submissionId = body.submissionId;
  if (typeof submissionId !== "string" || !UUID_RE.test(submissionId)) return json({ error: "Invalid submissionId." }, 400);

  // Look the submission up first so the per-form cap can be checked...
  const { data: sub } = await admin
    .from("form_submissions")
    .select("id, form_id, metadata, notified_at, created_at")
    .eq("id", submissionId)
    .maybeSingle();

  if (!sub || sub.notified_at || !sub.form_id || Date.now() - new Date(sub.created_at).getTime() > NOTIFY_WINDOW_MS) {
    return json({ success: true, skipped: true });
  }

  const { data: form } = await admin.from("custom_forms").select("name, fields, settings").eq("id", sub.form_id).maybeSingle();
  const to = (form?.settings as { notification_email?: unknown } | null)?.notification_email;
  if (!form || !isValidEmail(to)) return json({ success: true, skipped: true });

  const { count } = await admin
    .from("form_submissions")
    .select("id", { count: "exact", head: true })
    .eq("form_id", sub.form_id)
    .gt("notified_at", new Date(Date.now() - 60 * 60 * 1000).toISOString());
  if ((count ?? 0) >= NOTIFY_HOURLY_CAP) return json({ success: true, skipped: true, reason: "rate_limited" });

  // ...then claim it atomically: at most one email per submission.
  const { data: claimed } = await admin
    .from("form_submissions")
    .update({ notified_at: new Date().toISOString() })
    .eq("id", submissionId)
    .is("notified_at", null)
    .select("id")
    .maybeSingle();
  if (!claimed) return json({ success: true, skipped: true });

  const base = appUrl(req);
  const html = renderFormNotificationHtml({
    formName: form.name,
    rows: submissionRows(form.fields, (sub.metadata ?? {}) as Record<string, unknown>),
    dashboardUrl: `${base}/forms`,
  });

  const result = await sendOne({
    from: buildFrom(null, PLATFORM_FROM),
    to: [to],
    subject: `New response: ${String(form.name).slice(0, 120)}`,
    html,
  });
  if (!result.success) console.error("[send-email] form-notification failed:", result.error);
  return json(result, result.success ? 200 : 502);
}

// ---------------------------------------------------------------- entry

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return json({ error: "Server misconfigured" }, 500);
  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body = (await req.json()) as Record<string, unknown>;
    switch (body?.action) {
      case "send-campaign":
        return await sendCampaign(req, admin, body);
      case "test-campaign":
        return await testCampaign(req, admin, body);
      case "form-notification":
        return await formNotification(req, admin, body);
      default:
        return json({ error: "Invalid action" }, 400);
    }
  } catch (err) {
    console.error("[send-email] error", err);
    return json({ error: "Bad request" }, 400);
  }
});
