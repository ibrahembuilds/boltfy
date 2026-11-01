-- Regression tests for the multi-tenant schema, RLS and RPCs.
-- Run through supabase/tests/run.sh (needs a Postgres + the Supabase stub).
--
-- Each scenario impersonates the real API roles (`anon`, `authenticated`
-- with a JWT `sub`) so Row Level Security and GRANTs are exercised exactly
-- as PostgREST would. Every check either prints "ok - ..." or aborts the run.
\set ON_ERROR_STOP on
\set QUIET on

CREATE SCHEMA t;
GRANT USAGE ON SCHEMA t TO anon, authenticated;

CREATE FUNCTION t.ok(cond boolean, msg text) RETURNS void LANGUAGE plpgsql AS $f$
BEGIN
  IF cond IS NOT TRUE THEN RAISE EXCEPTION 'FAIL: %', msg; END IF;
  RAISE NOTICE 'ok - %', msg;
END $f$;

-- Passes only if `stmt` raises an error whose message contains `fragment`.
CREATE FUNCTION t.throws(stmt text, fragment text, msg text) RETURNS void LANGUAGE plpgsql AS $f$
DECLARE err text;
BEGIN
  BEGIN
    EXECUTE stmt;
  EXCEPTION WHEN OTHERS THEN
    err := SQLERRM;
  END;
  IF err IS NULL THEN
    RAISE EXCEPTION 'FAIL: % (expected an error containing "%", but it succeeded)', msg, fragment;
  END IF;
  IF position(lower(fragment) IN lower(err)) = 0 THEN
    RAISE EXCEPTION 'FAIL: % (expected "%", got "%")', msg, fragment, err;
  END IF;
  RAISE NOTICE 'ok - % [%]', msg, err;
END $f$;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA t TO anon, authenticated;

-- ---------------------------------------------------
-- Fixtures (superuser bypasses RLS)
-- ---------------------------------------------------
-- alice  aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa
-- bob    bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb
-- carol  cccccccc-cccc-cccc-cccc-cccccccccccc  (deleted in the account-deletion test)
INSERT INTO auth.users (id, email) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'alice@owner.test'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'bob@owner.test'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'carol@owner.test');

INSERT INTO public.custom_forms (id, name, slug, fields, settings, user_id) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Alice News', 'alice-news',
   '[{"id":"email","type":"email","label":"Email"},{"id":"name","type":"text","label":"Name"}]',
   '{"notification_email":"alice-private@owner.test","style":{"isSubscriberForm":true,"primaryColor":"#123456"}}',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('22222222-2222-2222-2222-222222222222', 'Alice Contact', 'alice-contact',
   '[{"id":"email","type":"email","label":"Email"},{"id":"message","type":"textarea","label":"Message"}]',
   '{"notification_email":"alice-private@owner.test","style":{}}',
   'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  ('33333333-3333-3333-3333-333333333333', 'Bob News', 'bob-news',
   '[{"id":"email","type":"email","label":"Email"},{"id":"name","type":"text","label":"Name"}]',
   '{"notification_email":"bob-private@owner.test","style":{"isSubscriberForm":true}}',
   'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  ('44444444-4444-4444-4444-444444444444', 'Carol Flood', 'carol-flood',
   '[{"id":"email","type":"email","label":"Email"}]',
   '{"style":{}}',
   'cccccccc-cccc-cccc-cccc-cccccccccccc');

-- ===================================================
-- 1. Two owners can have the same person on their lists
--    (this aborted the whole submission before: global UNIQUE(email))
-- ===================================================
DO $do$
DECLARE s1 uuid; s2 uuid;
BEGIN
  SET LOCAL ROLE anon;
  s1 := public.submit_public_form('11111111-1111-1111-1111-111111111111', '{"email":"Sam@Example.com","name":"Sam"}');
  s2 := public.submit_public_form('33333333-3333-3333-3333-333333333333', '{"email":"sam@example.com","name":"Sam"}');
  RESET ROLE;
  PERFORM t.ok(s1 IS NOT NULL AND s2 IS NOT NULL, 'same visitor can join two different owners'' lists');
  PERFORM t.ok((SELECT count(*) FROM public.subscribers WHERE email = 'sam@example.com') = 2, 'one subscriber row per owner');
  PERFORM t.ok((SELECT count(*) FROM public.form_submissions WHERE form_id = '33333333-3333-3333-3333-333333333333') = 1, 'second owner''s submission was saved');
END $do$;

-- ===================================================
-- 2. Server decides what a submission does, not the client
-- ===================================================
DO $do$
BEGIN
  SET LOCAL ROLE anon;
  -- client claims "subscribe me" on a form that is not a newsletter form
  PERFORM public.submit_public_form('22222222-2222-2222-2222-222222222222',
    '{"email":"evil@example.com","message":"hi"}', true, 'evil@example.com', 'Evil');
  RESET ROLE;
  PERFORM t.ok(NOT EXISTS (SELECT 1 FROM public.subscribers WHERE email = 'evil@example.com'),
    'client-supplied add-subscriber flag is ignored on non-newsletter forms');

  -- client passes a different address than the one in the form
  SET LOCAL ROLE anon;
  PERFORM public.submit_public_form('11111111-1111-1111-1111-111111111111',
    '{"email":"real@example.com","name":"R"}', true, 'victim@example.com', 'Victim');
  RESET ROLE;
  PERFORM t.ok(NOT EXISTS (SELECT 1 FROM public.subscribers WHERE email = 'victim@example.com'),
    'client-supplied subscriber email is ignored');
  PERFORM t.ok(EXISTS (SELECT 1 FROM public.subscribers WHERE email = 'real@example.com'),
    'address is taken from the form''s email field');
END $do$;

DO $do$
BEGIN
  -- case-insensitive de-duplication within one owner
  SET LOCAL ROLE anon;
  PERFORM public.submit_public_form('11111111-1111-1111-1111-111111111111', '{"email":"SAM@EXAMPLE.COM","name":"Sam"}');
  RESET ROLE;
  PERFORM t.ok((SELECT count(*) FROM public.subscribers
                WHERE user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' AND lower(email) = 'sam@example.com') = 1,
    'case variants of one address are a single subscriber');

  -- someone who unsubscribed is not silently re-enrolled by a stranger
  UPDATE public.subscribers SET status = 'unsubscribed'
   WHERE user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' AND email = 'sam@example.com';
  SET LOCAL ROLE anon;
  PERFORM public.submit_public_form('11111111-1111-1111-1111-111111111111', '{"email":"sam@example.com","name":"Sam"}');
  RESET ROLE;
  PERFORM t.ok((SELECT status FROM public.subscribers
                WHERE user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' AND email = 'sam@example.com') = 'unsubscribed',
    'unsubscribed address stays unsubscribed after re-submitting');
END $do$;

-- ===================================================
-- 3. Payload validation
-- ===================================================
DO $do$
DECLARE v_meta jsonb; v_before int;
BEGIN
  SET LOCAL ROLE anon;
  PERFORM public.submit_public_form('22222222-2222-2222-2222-222222222222',
    '{"email":"k@example.com","message":"hello","hack":"<script>","__proto__":"x"}');
  RESET ROLE;
  SELECT metadata INTO v_meta FROM public.form_submissions
   WHERE form_id = '22222222-2222-2222-2222-222222222222' AND metadata->>'message' = 'hello';
  PERFORM t.ok(v_meta ? 'message' AND NOT (v_meta ? 'hack') AND NOT (v_meta ? '__proto__'), 'keys that are not field ids are dropped');

  SET LOCAL ROLE anon;
  PERFORM t.throws($q$select public.submit_public_form('22222222-2222-2222-2222-222222222222', jsonb_build_object('message', repeat('x', 60000)))$q$,
    'too large', 'oversized payload is rejected');
  PERFORM t.throws($q$select public.submit_public_form('22222222-2222-2222-2222-222222222222', '{"nope":1}')$q$,
    'empty', 'payload with no real fields is rejected');
  PERFORM t.throws($q$select public.submit_public_form('22222222-2222-2222-2222-222222222222', '[]')$q$,
    'invalid', 'non-object payload is rejected');
  PERFORM t.throws($q$select public.submit_public_form('99999999-9999-9999-9999-999999999999', '{"a":1}')$q$,
    'no longer exists', 'unknown form is rejected');
  RESET ROLE;

  -- a malformed address must not cost the visitor their submission
  SELECT count(*) INTO v_before FROM public.subscribers;
  SET LOCAL ROLE anon;
  PERFORM public.submit_public_form('11111111-1111-1111-1111-111111111111', '{"email":"not-an-email","name":"X"}');
  RESET ROLE;
  PERFORM t.ok((SELECT count(*) FROM public.subscribers) = v_before, 'invalid email: no subscriber created');
  PERFORM t.ok(EXISTS (SELECT 1 FROM public.form_submissions WHERE metadata->>'email' = 'not-an-email'),
    'invalid email: submission itself is still saved');
END $do$;

-- ===================================================
-- 4. Server-side flood guard
-- ===================================================
DO $do$
BEGIN
  INSERT INTO public.form_submissions (form_id, form_name, metadata, user_id)
  SELECT '44444444-4444-4444-4444-444444444444', 'Carol Flood', jsonb_build_object('email', 'f' || g || '@example.com'),
         'cccccccc-cccc-cccc-cccc-cccccccccccc'
  FROM generate_series(1, 60) g;
  SET LOCAL ROLE anon;
  PERFORM t.throws($q$select public.submit_public_form('44444444-4444-4444-4444-444444444444', '{"email":"one-too-many@example.com"}')$q$,
    'too many responses', '61st submission within a minute is throttled');
  RESET ROLE;
END $do$;

-- ===================================================
-- 5. Form privacy: the public gets a safe projection only
-- ===================================================
DO $do$
DECLARE r record;
BEGIN
  SET LOCAL ROLE anon;
  PERFORM t.ok((SELECT count(*) FROM public.custom_forms) = 0, 'anon cannot read custom_forms directly');
  SELECT * INTO r FROM public.get_public_form('alice-news');
  PERFORM t.ok(r.id = '11111111-1111-1111-1111-111111111111', 'get_public_form finds a form by slug');
  PERFORM t.ok(NOT (r.settings ? 'notification_email'), 'notification_email is not exposed');
  PERFORM t.ok(r.settings->'style'->>'primaryColor' = '#123456', 'style is exposed');
  PERFORM t.ok(to_jsonb(r) ? 'user_id' IS FALSE, 'owner id is not exposed');
  PERFORM t.ok((SELECT id FROM public.get_public_form('11111111-1111-1111-1111-111111111111')) = '11111111-1111-1111-1111-111111111111',
    'get_public_form also resolves an id (links created before slugs)');
  PERFORM t.ok((SELECT count(*) FROM public.get_public_form('does-not-exist')) = 0, 'unknown slug returns nothing');
  RESET ROLE;
END $do$;

-- ===================================================
-- 6. Anonymous clients cannot read private tables or counters
-- ===================================================
DO $do$
BEGIN
  SET LOCAL ROLE anon;
  PERFORM t.ok((SELECT count(*) FROM public.subscribers) = 0, 'anon cannot read subscribers (or their unsubscribe tokens)');
  PERFORM t.ok((SELECT count(*) FROM public.form_submissions) = 0, 'anon cannot read submissions');
  PERFORM t.ok((SELECT count(*) FROM public.campaigns) = 0, 'anon cannot read campaigns');
  PERFORM t.ok((SELECT count(*) FROM public.user_settings) = 0, 'anon cannot read user_settings');
  PERFORM t.ok((SELECT count(*) FROM public.audit_logs) = 0, 'anon cannot read audit logs');
  PERFORM t.throws($q$select * from public.get_dashboard_stats()$q$, 'permission denied', 'anon cannot call get_dashboard_stats');
  PERFORM t.throws($q$select * from public.get_form_submission_counts()$q$, 'permission denied', 'anon cannot call get_form_submission_counts');
  RESET ROLE;
END $do$;

-- ===================================================
-- 7. Tenant isolation for a signed-in owner
-- ===================================================
DO $do$
DECLARE n int;
BEGIN
  PERFORM set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true);
  SET LOCAL ROLE authenticated;
  PERFORM t.ok((SELECT count(*) FROM public.custom_forms) = 2, 'alice sees only her own two forms');
  PERFORM t.ok(NOT EXISTS (SELECT 1 FROM public.subscribers WHERE user_id <> 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'), 'alice sees none of bob''s subscribers');

  UPDATE public.subscribers SET name = 'pwned' WHERE user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM t.ok(n = 0, 'alice cannot update bob''s subscribers');
  DELETE FROM public.subscribers WHERE user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  GET DIAGNOSTICS n = ROW_COUNT;
  PERFORM t.ok(n = 0, 'alice cannot delete bob''s subscribers');

  PERFORM t.throws($q$insert into public.subscribers(email,name,user_id) values ('x@example.com','x','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')$q$,
    'row-level security', 'alice cannot plant a subscriber in bob''s account');
  PERFORM t.throws($q$update public.custom_forms set user_id='bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' where slug='alice-news'$q$,
    'row-level security', 'alice cannot hand her form to bob');
  RESET ROLE;
END $do$;

-- ===================================================
-- 8. Owner-side subscriber rules
-- ===================================================
DO $do$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true);
  SET LOCAL ROLE authenticated;
  INSERT INTO public.subscribers (email, name, user_id) VALUES ('  MiXeD@Example.com ', 'Mixed', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
  PERFORM t.ok(EXISTS (SELECT 1 FROM public.subscribers WHERE email = 'mixed@example.com'), 'addresses are trimmed and lower-cased on insert');
  PERFORM t.throws($q$insert into public.subscribers(email,name,user_id) values ('mixed@EXAMPLE.com','dup','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')$q$,
    'duplicate key', 'the same address cannot be added twice by one owner');
  PERFORM t.throws($q$insert into public.subscribers(email,name,user_id) values ('bad','x','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')$q$,
    'valid_email', 'malformed address is rejected');
  RESET ROLE;
END $do$;

-- ===================================================
-- 9. Unsubscribe
-- ===================================================
DO $do$
DECLARE v_token uuid;
BEGIN
  SELECT unsubscribe_token INTO v_token FROM public.subscribers
   WHERE user_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' AND email = 'sam@example.com';

  SET LOCAL ROLE anon;
  PERFORM t.ok(public.unsubscribe_by_token(gen_random_uuid()) IS FALSE, 'unknown token unsubscribes nobody');
  RESET ROLE;
  PERFORM t.ok((SELECT status FROM public.subscribers WHERE unsubscribe_token = v_token) = 'active', 'wrong token left the subscriber active');

  SET LOCAL ROLE anon;
  PERFORM t.ok(public.unsubscribe_by_token(v_token) IS TRUE, 'correct token unsubscribes');
  RESET ROLE;
  PERFORM t.ok((SELECT status FROM public.subscribers WHERE unsubscribe_token = v_token) = 'unsubscribed', 'status is now unsubscribed');

  -- legacy links: still work, but no longer tell strangers who is subscribed
  SET LOCAL ROLE anon;
  PERFORM t.ok(public.unsubscribe_email('nobody@example.com', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') IS TRUE
           AND public.unsubscribe_email('real@example.com',  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') IS TRUE,
    'legacy unsubscribe answers identically for existing and missing pairs (no oracle)');
  RESET ROLE;
  PERFORM t.ok((SELECT status FROM public.subscribers WHERE email = 'real@example.com' AND user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') = 'unsubscribed',
    'legacy link still unsubscribes');
END $do$;

-- ===================================================
-- 10. Counters are real (the old UI counted a LIMIT 5 / LIMIT 100 sample)
-- ===================================================
DO $do$
DECLARE expected bigint; got bigint; form_expected bigint;
BEGIN
  INSERT INTO public.form_submissions (form_id, form_name, metadata, user_id)
  SELECT '22222222-2222-2222-2222-222222222222', 'Alice Contact', jsonb_build_object('email', 'bulk' || g || '@example.com'),
         'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
  FROM generate_series(1, 150) g;

  SELECT count(*) INTO expected FROM public.form_submissions WHERE user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  SELECT count(*) INTO form_expected FROM public.form_submissions WHERE form_id = '22222222-2222-2222-2222-222222222222';

  PERFORM set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true);
  SET LOCAL ROLE authenticated;
  SELECT total_submissions INTO got FROM public.get_dashboard_stats();
  PERFORM t.ok(expected > 150 AND got = expected, 'dashboard total_submissions is not capped (' || got || ')');
  PERFORM t.ok((SELECT total_forms FROM public.get_dashboard_stats()) = 2, 'dashboard counts only alice''s forms');
  PERFORM t.ok((SELECT submissions FROM public.get_form_submission_counts() WHERE form_id = '22222222-2222-2222-2222-222222222222') = form_expected,
    'per-form count is not limited to the latest 100 rows');
  PERFORM t.ok(NOT EXISTS (SELECT 1 FROM public.get_form_submission_counts() WHERE form_id = '33333333-3333-3333-3333-333333333333'),
    'per-form counts exclude other owners'' forms');
  RESET ROLE;
END $do$;

-- ===================================================
-- 11. user_settings and campaign lifecycle
-- ===================================================
DO $do$
BEGIN
  PERFORM set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', true);
  SET LOCAL ROLE authenticated;
  INSERT INTO public.user_settings (user_id, sender_name, reply_to_email, postal_address)
  VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Alice Co', 'hello@alice.test', '1 Main St');
  PERFORM t.ok((SELECT sender_name FROM public.user_settings) = 'Alice Co', 'owner can save and read own settings');
  PERFORM t.throws($q$insert into public.user_settings(user_id) values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb')$q$,
    'row-level security', 'owner cannot write another user''s settings');
  PERFORM t.throws($q$update public.user_settings set reply_to_email = 'not an email'$q$,
    'check constraint', 'invalid reply-to address is rejected');

  INSERT INTO public.campaigns (subject, content, status, user_id) VALUES ('Hi', 'x', 'sending', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
  PERFORM t.ok(EXISTS (SELECT 1 FROM public.campaigns WHERE status = 'sending'), 'campaign can be in the sending state');
  PERFORM t.throws($q$insert into public.campaigns(subject,status,user_id) values ('Hi','bogus','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa')$q$,
    'campaigns_status_check', 'unknown campaign status is rejected');
  RESET ROLE;
END $do$;

-- ===================================================
-- 12. Auditing works, and deleting an account actually works
--     (it used to fail on audit_logs_user_id_fkey)
-- ===================================================
DO $do$
DECLARE alice_before bigint;
BEGIN
  PERFORM t.ok(EXISTS (SELECT 1 FROM public.audit_logs WHERE user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa' AND table_name = 'subscribers'),
    'normal activity is still written to the audit log');

  -- give carol data in every table that references her
  PERFORM set_config('request.jwt.claim.sub', 'cccccccc-cccc-cccc-cccc-cccccccccccc', true);
  SET LOCAL ROLE authenticated;
  INSERT INTO public.subscribers (email, name, user_id) VALUES ('carols-fan@example.com', 'Fan', 'cccccccc-cccc-cccc-cccc-cccccccccccc');
  INSERT INTO public.user_settings (user_id, sender_name) VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Carol');
  INSERT INTO public.campaigns (subject, status, user_id) VALUES ('c', 'draft', 'cccccccc-cccc-cccc-cccc-cccccccccccc');
  RESET ROLE;
  PERFORM t.ok(EXISTS (SELECT 1 FROM public.audit_logs WHERE user_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'), 'carol has audit rows (PII copies) before deletion');

  SELECT count(*) INTO alice_before FROM public.subscribers WHERE user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  DELETE FROM auth.users WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc';

  PERFORM t.ok(NOT EXISTS (SELECT 1 FROM auth.users WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'), 'user row deleted');
  PERFORM t.ok(NOT EXISTS (SELECT 1 FROM public.custom_forms      WHERE user_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc')
           AND NOT EXISTS (SELECT 1 FROM public.form_submissions  WHERE user_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc')
           AND NOT EXISTS (SELECT 1 FROM public.subscribers       WHERE user_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc')
           AND NOT EXISTS (SELECT 1 FROM public.campaigns         WHERE user_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc')
           AND NOT EXISTS (SELECT 1 FROM public.user_settings     WHERE user_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
    'all of carol''s data is gone');
  PERFORM t.ok(NOT EXISTS (SELECT 1 FROM public.audit_logs WHERE user_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'),
    'no audit rows (or PII copies) survive the account');
  PERFORM t.ok((SELECT count(*) FROM public.subscribers WHERE user_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa') = alice_before,
    'other owners'' data is untouched');
END $do$;

-- ===================================================
-- 13. Realtime
-- ===================================================
DO $do$
BEGIN
  PERFORM t.ok(EXISTS (SELECT 1 FROM pg_publication_tables
                       WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'form_submissions'),
    'form_submissions is published to realtime (the "New Response" toast depends on it)');
END $do$;
