// Supabase Edge Function: send-email
//
// Holds the Resend API key server-side (set via `supabase secrets set
// RESEND_API_KEY=...`) so it never reaches the browser bundle. Two actions:
//
//  - "campaign": the authenticated caller emails their own subscriber list.
//    Requires a valid user JWT; the caller supplies to/subject/html directly
//    since it's their own account sending to their own audience.
//
//  - "form-notification": fired anonymously when a visitor submits a public
//    form. The recipient is resolved here from custom_forms.settings by
//    form_id — a client-supplied "to" is never trusted — so this endpoint
//    can't be used as an open relay to arbitrary addresses.
//
//  - "contact": the public contact form. The inbox is SUPPORT_INBOX, or
//    support@boltfy.io. The visitor's address is used only as reply-to.
//
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sendViaResend(payload: {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}) {
  if (!RESEND_API_KEY) {
    console.log("[send-email] RESEND_API_KEY not configured, logging instead:", payload.subject, "->", payload.to);
    return { success: true, messageId: `dev-${Date.now()}` };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: payload.from || "Boltfy <noreply@boltfy.com>",
      to: Array.isArray(payload.to) ? payload.to : [payload.to],
      subject: payload.subject,
      html: payload.html,
      reply_to: payload.replyTo,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    return { success: false, error: data.message || "Failed to send email" };
  }
  return { success: true, messageId: data.id };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formNotificationHtml(formName: string, data: Record<string, string>) {
  const rows = Object.entries(data)
    .map(([key, value]) => `<p style="margin:8px 0;"><strong>${escapeHtml(String(key))}:</strong> ${escapeHtml(String(value))}</p>`)
    .join("");

  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px;">
      <div style="background:white;border-radius:16px;padding:40px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
        <h1 style="color:#1e293b;font-size:24px;font-weight:700;">New Submission: ${escapeHtml(formName)}</h1>
        <p style="color:#475569;">Someone just submitted your form.</p>
        <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin:16px 0;">${rows}</div>
        <p style="color:#475569;">Keep growing! 🚀<br>The Boltfy Team</p>
      </div>
    </div>
  `;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ error: "Server misconfigured" }, 500);
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body = await req.json();

    if (body.action === "campaign") {
      const authHeader = req.headers.get("Authorization") || "";
      const jwt = authHeader.replace("Bearer ", "");
      const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(jwt);

      if (userErr || !userData?.user) {
        return json({ error: "Unauthorized" }, 401);
      }

      const { to, subject, html, from, replyTo } = body;
      if (!to || !subject || !html) {
        return json({ error: "Missing to/subject/html" }, 400);
      }

      const result = await sendViaResend({ to, subject, html, from, replyTo });
      return json(result, result.success ? 200 : 502);
    }

    if (body.action === "form-notification") {
      const { formId, submissionData } = body;
      if (!formId) {
        return json({ error: "Missing formId" }, 400);
      }

      const { data: form, error: formErr } = await supabaseAdmin
        .from("custom_forms")
        .select("name, settings")
        .eq("id", formId)
        .maybeSingle();

      if (formErr || !form) {
        return json({ error: "Form not found" }, 404);
      }

      const settings = (form.settings ?? {}) as { notification_email?: string };
      const notificationEmail = settings.notification_email;

      if (!notificationEmail) {
        return json({ success: true, skipped: true });
      }

      const html = formNotificationHtml(form.name, submissionData || {});
      const result = await sendViaResend({
        to: notificationEmail,
        subject: `New submission: ${form.name}`,
        html,
      });
      return json(result, result.success ? 200 : 502);
    }

    if (body.action === "contact") {
      const name = String(body.name || "").trim();
      const email = String(body.email || "").trim();
      const subject = String(body.subject || "").trim().replace(/[\r\n]+/g, " ");
      const message = String(body.message || "").trim();
      const website = String(body.website || "").trim();

      if (website) {
        return json({ success: true, skipped: true });
      }

      const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      if (name.length < 1 || name.length > 80) {
        return json({ success: false, error: "Name must be 1–80 characters." }, 400);
      }
      if (!emailOk || email.length > 200) {
        return json({ success: false, error: "Enter a valid email address." }, 400);
      }
      if (subject.length < 1 || subject.length > 140) {
        return json({ success: false, error: "Subject must be 1–140 characters." }, 400);
      }
      if (message.length < 1 || message.length > 4000) {
        return json({ success: false, error: "Message must be 1–4000 characters." }, 400);
      }

      const inbox = Deno.env.get("SUPPORT_INBOX") || "support@boltfy.io";
      const html = `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
          <h1 style="font-size:20px;">Boltfy contact form</h1>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          <p style="white-space:pre-wrap;">${escapeHtml(message)}</p>
        </div>`;

      const result = await sendViaResend({
        to: inbox,
        subject: `[Boltfy] ${subject}`,
        html,
        replyTo: email,
      });
      return json(result, result.success ? 200 : 502);
    }

    return json({ error: "Invalid action" }, 400);
  } catch (err) {
    console.error("[send-email] error", err);
    return json({ error: String(err) }, 500);
  }
});
