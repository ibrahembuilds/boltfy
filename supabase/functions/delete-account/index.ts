// Supabase Edge Function: delete-account
//
// Permanently deletes the calling user. Deleting an auth user needs the
// service role, so it cannot be done from the browser. All of the user's
// forms, submissions, subscribers, campaigns, templates, settings and audit
// rows are removed by ON DELETE CASCADE (covered by supabase/tests).
//
// The caller must repeat their own login email in the request body as a
// last guard against an accidental or scripted call.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { corsHeaders, json } from "../_shared/http.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return json({ error: "Server misconfigured" }, 500);

  const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
  const { data, error } = jwt ? await admin.auth.getUser(jwt) : { data: null, error: new Error("no token") };
  const user = error ? null : data?.user;
  if (!user) return json({ error: "Unauthorized" }, 401);

  const body = await req.json().catch(() => ({}));
  const confirmation = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!user.email || confirmation !== user.email.toLowerCase()) {
    return json({ error: "Email confirmation does not match your account." }, 400);
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) {
    console.error("[delete-account] failed", deleteError);
    return json({ error: "Could not delete the account. Please try again or contact support." }, 500);
  }
  return json({ success: true });
});
