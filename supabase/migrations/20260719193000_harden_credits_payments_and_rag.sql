/*
 * Security hardening:
 * - reserve/refund/finalize evaluation credits atomically
 * - make Razorpay fulfillment idempotent and atomic
 * - keep credit and RAG RPCs callable only by the service role
 * - prevent direct anonymous downloads of the private RAG corpus
 */

CREATE TABLE IF NOT EXISTS public.evaluation_credit_reservations (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  credit_charged boolean NOT NULL,
  status text NOT NULL DEFAULT 'reserved'
    CHECK (status IN ('reserved', 'completed', 'refunded')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.evaluation_credit_reservations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.evaluation_credit_reservations FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.evaluation_credit_reservations TO service_role;

CREATE OR REPLACE FUNCTION public.reserve_evaluation_credit(
  p_user_id uuid,
  p_request_id uuid
)
RETURNS TABLE (ok boolean, unlimited boolean, credits integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_credits integer;
  v_unlimited_until timestamptz;
  v_stale_refunds integer := 0;
BEGIN
  SELECT p.credits, p.unlimited_until
    INTO v_credits, v_unlimited_until
    FROM public.profiles p
    WHERE p.id = p_user_id
    FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, false, 0;
    RETURN;
  END IF;

  WITH refunded AS (
    UPDATE public.evaluation_credit_reservations r
       SET status = 'refunded', updated_at = now()
     WHERE r.user_id = p_user_id
       AND r.status = 'reserved'
       AND r.credit_charged
       AND r.created_at < now() - interval '15 minutes'
    RETURNING 1
  )
  SELECT count(*)::integer INTO v_stale_refunds FROM refunded;

  IF v_stale_refunds > 0 THEN
    UPDATE public.profiles
       SET credits = COALESCE(credits, 0) + v_stale_refunds
     WHERE id = p_user_id
    RETURNING profiles.credits INTO v_credits;
  END IF;

  IF v_unlimited_until IS NOT NULL AND v_unlimited_until > now() THEN
    INSERT INTO public.evaluation_credit_reservations
      (id, user_id, credit_charged)
    VALUES (p_request_id, p_user_id, false);
    RETURN QUERY SELECT true, true, COALESCE(v_credits, 0);
    RETURN;
  END IF;

  IF COALESCE(v_credits, 0) <= 0 THEN
    RETURN QUERY SELECT false, false, 0;
    RETURN;
  END IF;

  UPDATE public.profiles
     SET credits = credits - 1
   WHERE id = p_user_id
  RETURNING profiles.credits INTO v_credits;

  INSERT INTO public.evaluation_credit_reservations
    (id, user_id, credit_charged)
  VALUES (p_request_id, p_user_id, true);

  RETURN QUERY SELECT true, false, v_credits;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_evaluation_credit(
  p_user_id uuid,
  p_request_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.evaluation_credit_reservations
     SET status = 'completed', updated_at = now()
   WHERE id = p_request_id
     AND user_id = p_user_id
     AND status = 'reserved';
  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.refund_evaluation_credit(
  p_user_id uuid,
  p_request_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_charged boolean;
BEGIN
  SELECT credit_charged
    INTO v_charged
    FROM public.evaluation_credit_reservations
   WHERE id = p_request_id
     AND user_id = p_user_id
     AND status = 'reserved'
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  UPDATE public.evaluation_credit_reservations
     SET status = 'refunded', updated_at = now()
   WHERE id = p_request_id;

  IF v_charged THEN
    UPDATE public.profiles
       SET credits = COALESCE(credits, 0) + 1
     WHERE id = p_user_id;
  END IF;
  RETURN true;
END;
$$;

CREATE TABLE IF NOT EXISTS public.razorpay_payment_events (
  payment_id text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_paise integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.razorpay_payment_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.razorpay_payment_events FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.razorpay_payment_events TO service_role;

CREATE OR REPLACE FUNCTION public.fulfill_razorpay_payment(
  p_payment_id text,
  p_email text,
  p_amount_paise integer
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_inserted integer;
BEGIN
  IF p_payment_id IS NULL OR p_email IS NULL OR
     p_amount_paise NOT IN (3900, 9900, 19900) THEN
    RETURN 'invalid';
  END IF;

  SELECT id INTO v_user_id
    FROM public.profiles
   WHERE lower(email) = lower(p_email)
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN 'profile_not_found';
  END IF;

  INSERT INTO public.razorpay_payment_events (payment_id, user_id, amount_paise)
  VALUES (p_payment_id, v_user_id, p_amount_paise)
  ON CONFLICT (payment_id) DO NOTHING;
  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  IF v_inserted = 0 THEN
    RETURN 'duplicate';
  END IF;

  IF p_amount_paise = 3900 THEN
    UPDATE public.profiles SET credits = COALESCE(credits, 0) + 15 WHERE id = v_user_id;
  ELSIF p_amount_paise = 9900 THEN
    UPDATE public.profiles SET credits = COALESCE(credits, 0) + 50 WHERE id = v_user_id;
  ELSE
    UPDATE public.profiles
       SET unlimited_until = GREATEST(now(), COALESCE(unlimited_until, now())) + interval '60 days'
     WHERE id = v_user_id;
  END IF;

  RETURN 'fulfilled';
END;
$$;

REVOKE ALL ON FUNCTION public.reserve_evaluation_credit(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_evaluation_credit(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.refund_evaluation_credit(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fulfill_razorpay_payment(text, text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reserve_evaluation_credit(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_evaluation_credit(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.refund_evaluation_credit(uuid, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.fulfill_razorpay_payment(text, text, integer) TO service_role;

REVOKE EXECUTE ON FUNCTION public.decrement_credit(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_credit(uuid) TO service_role;

DO $$
DECLARE
  fn record;
BEGIN
  FOR fn IN
    SELECT p.oid::regprocedure AS signature
      FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.proname = 'match_chunks'
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', fn.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', fn.signature);
  END LOOP;

  IF to_regclass('public.material_chunks') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "anon_select_material_chunks" ON public.material_chunks';
    EXECUTE 'DROP POLICY IF EXISTS "Public can read material chunks" ON public.material_chunks';
    EXECUTE 'REVOKE SELECT ON public.material_chunks FROM anon, authenticated';
  END IF;

  IF to_regclass('public.reference_chunks') IS NOT NULL THEN
    EXECUTE 'DROP POLICY IF EXISTS "anon_select_reference_chunks" ON public.reference_chunks';
    EXECUTE 'REVOKE SELECT ON public.reference_chunks FROM anon, authenticated';
  END IF;
END;
$$;
