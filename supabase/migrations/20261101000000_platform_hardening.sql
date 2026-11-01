-- =====================================================
-- PLATFORM HARDENING
-- =====================================================
-- Fixes found by running the previous migrations against a real
-- Postgres and probing them as the `anon` / `authenticated` roles:
--
--   1. subscribers.email was globally UNIQUE, so two customers could not
--      have the same person on their lists. submit_public_form() then
--      aborted the whole transaction (the visitor's submission was lost)
--      and the error revealed that the address exists in someone else's
--      list.
--   2. custom_forms was readable by anyone (needed for /f/:slug), which
--      also exposed every owner's notification_email and user_id.
--   3. unsubscribe_email() needed no secret and answered true/false, so it
--      was both an "is this address subscribed?" oracle and a way to
--      unsubscribe strangers.
--   4. Deleting a user failed: the audit trigger wrote a row pointing at
--      the user being deleted, violating audit_logs_user_id_fkey. Account
--      deletion / GDPR erasure was impossible.
--   5. submit_public_form() trusted the client's p_add_subscriber flag and
--      email, accepted unbounded payloads / unknown keys, and had no
--      server-side throttle.
--
-- It also adds the server pieces the app needed to do real work:
-- dashboard/form counters, per-user sender settings, campaign states.
-- =====================================================

-- ---------------------------------------------------
-- 1. Subscribers: unique per tenant, not globally
-- ---------------------------------------------------
ALTER TABLE public.subscribers DROP CONSTRAINT IF EXISTS subscribers_email_key;
ALTER TABLE public.subscribers DROP CONSTRAINT IF EXISTS subscribers_user_id_email_key;
ALTER TABLE public.subscribers
  ADD CONSTRAINT subscribers_user_id_email_key UNIQUE (user_id, email);

-- Secret used in unsubscribe links. Existing rows get a token because the
-- volatile default is evaluated per row.
ALTER TABLE public.subscribers
  ADD COLUMN IF NOT EXISTS unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid();
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscribers_unsubscribe_token
  ON public.subscribers(unsubscribe_token);

-- Normalise addresses so "Sam@X.com" and "sam@x.com" are one person.
-- (No backfill: legacy rows that differ only by case would collide.)
CREATE OR REPLACE FUNCTION public.normalize_subscriber_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.email := lower(btrim(NEW.email));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS normalize_subscriber_email ON public.subscribers;
CREATE TRIGGER normalize_subscriber_email
  BEFORE INSERT OR UPDATE OF email ON public.subscribers
  FOR EACH ROW EXECUTE FUNCTION public.normalize_subscriber_email();

-- ---------------------------------------------------
-- 2. Forms: owner-only table access, safe public RPC
-- ---------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view forms to fill them out" ON public.custom_forms;
DROP POLICY IF EXISTS "Users can view own forms" ON public.custom_forms;
CREATE POLICY "Users can view own forms" ON public.custom_forms
  FOR SELECT USING (auth.uid() = user_id);

-- What an anonymous visitor needs to render and fill a form, and nothing
-- else: no user_id, no notification_email, no other settings keys.
CREATE OR REPLACE FUNCTION public.get_public_form(p_slug TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  description TEXT,
  fields JSONB,
  settings JSONB
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT f.id, f.name, f.slug, f.description, f.fields,
         jsonb_build_object('style', COALESCE(f.settings->'style', '{}'::jsonb))
  FROM public.custom_forms f
  WHERE f.slug = p_slug OR f.id::text = p_slug
  ORDER BY (f.slug = p_slug) DESC   -- a real slug wins over an id-shaped slug
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_form(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_form(TEXT) TO anon, authenticated;

-- ---------------------------------------------------
-- 3. Public submission RPC (hardened)
-- ---------------------------------------------------
ALTER TABLE public.form_submissions
  ADD COLUMN IF NOT EXISTS notified_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_form_submissions_form_created
  ON public.form_submissions(form_id, created_at DESC);

-- p_add_subscriber / p_subscriber_email are kept so already-deployed
-- clients keep working, but they are IGNORED: whether a submission joins
-- the owner's list is decided by the form's own settings, and the address
-- is taken from the form's email field, never from a client flag.
CREATE OR REPLACE FUNCTION public.submit_public_form(
  p_form_id UUID,
  p_metadata JSONB,
  p_add_subscriber BOOLEAN DEFAULT false,
  p_subscriber_email TEXT DEFAULT NULL,
  p_subscriber_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_form public.custom_forms%ROWTYPE;
  v_fields JSONB;
  v_clean JSONB;
  v_email TEXT;
  v_name TEXT;
  v_submission_id UUID;
BEGIN
  SELECT * INTO v_form FROM public.custom_forms WHERE id = p_form_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'This form no longer exists.';
  END IF;

  IF p_metadata IS NULL OR jsonb_typeof(p_metadata) <> 'object' THEN
    RAISE EXCEPTION 'Invalid submission.';
  END IF;
  IF octet_length(p_metadata::text) > 50000 THEN
    RAISE EXCEPTION 'Your submission is too large.';
  END IF;

  -- Per-form flood guard (the client-side honeypot is trivially bypassed
  -- by calling this RPC directly).
  IF (SELECT count(*) FROM public.form_submissions
      WHERE form_id = p_form_id AND created_at > now() - interval '1 minute') >= 60 THEN
    RAISE EXCEPTION 'This form is receiving too many responses right now. Please try again in a minute.';
  END IF;

  v_fields := CASE WHEN jsonb_typeof(v_form.fields) = 'array' THEN v_form.fields ELSE '[]'::jsonb END;

  -- Keep only keys that are real field ids of this form.
  SELECT COALESCE(jsonb_object_agg(e.key, e.value), '{}'::jsonb) INTO v_clean
  FROM jsonb_each(p_metadata) AS e
  WHERE e.key IN (SELECT fld->>'id' FROM jsonb_array_elements(v_fields) AS fld);

  IF v_clean = '{}'::jsonb THEN
    RAISE EXCEPTION 'Your submission is empty.';
  END IF;

  INSERT INTO public.form_submissions (form_id, form_name, metadata, user_id)
  VALUES (p_form_id, v_form.name, v_clean, v_form.user_id)
  RETURNING id INTO v_submission_id;

  -- Newsletter signup: decided by the form, address taken from its email field.
  IF (v_form.settings->'style'->'isSubscriberForm') = 'true'::jsonb THEN
    SELECT btrim(lower(v_clean->>(fld->>'id'))) INTO v_email
    FROM jsonb_array_elements(v_fields) AS fld
    WHERE fld->>'type' = 'email'
      AND COALESCE(v_clean->>(fld->>'id'), '') <> ''
    LIMIT 1;

    IF v_email IS NOT NULL
       AND length(v_email) <= 254
       AND v_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
      v_name := NULLIF(left(btrim(COALESCE(p_subscriber_name, '')), 200), '');

      -- Someone who already unsubscribed stays unsubscribed: a stranger
      -- typing their address into a form must not re-enrol them.
      INSERT INTO public.subscribers (email, name, status, user_id, source)
      VALUES (
        v_email,
        COALESCE(v_name, split_part(v_email, '@', 1)),
        'active',
        v_form.user_id,
        'Form: ' || left(COALESCE(v_form.name, 'Untitled'), 100)
      )
      ON CONFLICT (user_id, email) DO NOTHING;
    END IF;
  END IF;

  RETURN v_submission_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_public_form(UUID, JSONB, BOOLEAN, TEXT, TEXT) TO anon, authenticated;

-- ---------------------------------------------------
-- 4. Unsubscribe by secret token
-- ---------------------------------------------------
CREATE OR REPLACE FUNCTION public.unsubscribe_by_token(p_token UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rows INTEGER;
BEGIN
  UPDATE public.subscribers
  SET status = 'unsubscribed'
  WHERE unsubscribe_token = p_token;

  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.unsubscribe_by_token(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unsubscribe_by_token(UUID) TO anon, authenticated;

-- Legacy ?owner=&email= links may already be sitting in delivered emails, so
-- they must keep working for a while (an unsubscribe link that silently
-- fails is a legal problem for the sender). The function no longer reveals
-- whether the pair existed. TODO: drop it once those emails are old:
--   DROP FUNCTION public.unsubscribe_email(TEXT, UUID);
CREATE OR REPLACE FUNCTION public.unsubscribe_email(
  p_email TEXT,
  p_owner_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.subscribers
  SET status = 'unsubscribed'
  WHERE lower(email) = lower(btrim(p_email)) AND user_id = p_owner_id;

  RETURN true;
END;
$$;

-- ---------------------------------------------------
-- 5. Audit log: never block, and never outlive, an account
-- ---------------------------------------------------
-- The FK used to be ON DELETE SET NULL, but the audit trigger inserts a new
-- row for every cascaded delete, pointing at the user that is mid-deletion.
-- Skip logging in that case, and make old audit rows (which hold copies of
-- subscriber PII) go away with the account.
ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_user_id_fkey;
ALTER TABLE public.audit_logs
  ADD CONSTRAINT audit_logs_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION public.audit_trigger_function()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_uid := OLD.user_id;
  ELSE
    v_uid := NEW.user_id;
  END IF;

  -- Account being deleted (rows are cascading) or an ownerless legacy row.
  IF v_uid IS NULL OR NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_uid) THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, new_data)
    VALUES (v_uid, 'INSERT', TG_TABLE_NAME, NEW.id, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data)
    VALUES (v_uid, 'UPDATE', TG_TABLE_NAME, NEW.id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    RETURN NEW;
  ELSE
    INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data)
    VALUES (v_uid, 'DELETE', TG_TABLE_NAME, OLD.id, row_to_json(OLD)::jsonb);
    RETURN OLD;
  END IF;
END;
$$;

-- ---------------------------------------------------
-- 6. Real counters (RLS applies: SECURITY INVOKER)
-- ---------------------------------------------------
-- The dashboard used to count the rows of a `.limit(5)` query and the Forms
-- page counted the latest 100 rows, so both stopped being true quickly.
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS TABLE (
  total_forms BIGINT,
  total_submissions BIGINT,
  submissions_this_week BIGINT,
  total_subscribers BIGINT,
  active_subscribers BIGINT
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    (SELECT count(*) FROM public.custom_forms WHERE user_id = auth.uid()),
    (SELECT count(*) FROM public.form_submissions WHERE user_id = auth.uid()),
    (SELECT count(*) FROM public.form_submissions
       WHERE user_id = auth.uid() AND created_at >= now() - interval '7 days'),
    (SELECT count(*) FROM public.subscribers WHERE user_id = auth.uid()),
    (SELECT count(*) FROM public.subscribers WHERE user_id = auth.uid() AND status = 'active');
$$;

CREATE OR REPLACE FUNCTION public.get_form_submission_counts()
RETURNS TABLE (
  form_id UUID,
  submissions BIGINT,
  last_submission_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT s.form_id, count(*), max(s.created_at)
  FROM public.form_submissions s
  WHERE s.user_id = auth.uid() AND s.form_id IS NOT NULL
  GROUP BY s.form_id;
$$;

REVOKE ALL ON FUNCTION public.get_dashboard_stats() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_form_submission_counts() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_form_submission_counts() TO authenticated;

-- ---------------------------------------------------
-- 7. Per-user sender settings
-- ---------------------------------------------------
-- Settings used to be a page that showed a "saved" toast and stored
-- nothing. These are the values the send-email function actually uses.
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name TEXT CHECK (sender_name IS NULL OR char_length(sender_name) <= 100),
  reply_to_email TEXT CHECK (
    reply_to_email IS NULL OR
    (char_length(reply_to_email) <= 254 AND reply_to_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
  ),
  -- Commercial email law (CAN-SPAM and others) requires a postal address.
  postal_address TEXT CHECK (postal_address IS NULL OR char_length(postal_address) <= 300),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
DROP POLICY IF EXISTS "Users can delete own settings" ON public.user_settings;
CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own settings" ON public.user_settings
  FOR DELETE USING (auth.uid() = user_id);

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------
-- 8. Campaign lifecycle
-- ---------------------------------------------------
-- Sending now happens server-side, so a campaign needs states between
-- "draft" and "sent", and somewhere to record what went wrong.
ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS campaigns_status_check;
ALTER TABLE public.campaigns
  ADD CONSTRAINT campaigns_status_check
  CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'failed'));

ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS failed_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS last_error TEXT;

-- ---------------------------------------------------
-- 9. Realtime: the Forms page listens for new submissions
-- ---------------------------------------------------
-- Nothing in the earlier migrations added form_submissions to the realtime
-- publication, so the "New Response" toast could never fire unless someone
-- had toggled it in the dashboard.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1 FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'form_submissions'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.form_submissions;
  END IF;
END $$;
