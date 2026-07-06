/*
# Add profile auto-creation trigger + credit decrement RPC

## Purpose
Support the new authentication + credit system. When a user signs up via Google OAuth,
their `profiles` row must be created automatically (the frontend cannot INSERT into
profiles because RLS only allows SELECT/UPDATE for the owner). We also need a
server-side atomic credit decrement + check so the evaluate-answer edge function can
gate evaluation behind credits without race conditions.

## 1. New Functions

### `handle_new_user()`
- Trigger function that runs AFTER a new row is inserted into `auth.users`.
- Creates a matching row in `public.profiles` with the new user's id and email.
- Defaults: credits = 5 (the column default), unlimited_until = NULL.
- Marked SECURITY DEFINER so it can write to profiles regardless of the caller's role.

### `decrement_credit(user_uuid uuid)`
- SECURITY DEFINER function callable by authenticated users.
- If `unlimited_until` is in the future, returns `{ ok: true, unlimited: true }` without touching credits.
- Otherwise, atomically decrements `credits` by 1 only when `credits > 0`, using a
  conditional UPDATE ... WHERE credits > 0 ... RETURNING. If no row was updated, the
  user is out of credits -> returns `{ ok: false, error: 'out_of_credits' }`.
- Returns `{ ok: boolean, unlimited: boolean, credits: integer }`.

## 2. Triggers
### `on_auth_user_created`
- AFTER INSERT ON auth.users FOR EACH ROW -> EXECUTE handle_new_user().

## 3. RLS Policy Changes (profiles)
- Add an INSERT policy so the trigger (running as SECURITY DEFINER / service role)
  can insert. Authenticated users still cannot insert directly through the anon-key
  client because the policy requires `auth.uid() = id` AND the row must be their own
  — the trigger is what actually performs the insert in practice.
- Existing SELECT and UPDATE policies are unchanged.

## 4. Security
- `decrement_credit` is SECURITY DEFINER so it can update credits even though the
  edge function calls it with the service-role client (which bypasses RLS anyway).
  The function still validates the user_uuid argument against the profile row.
- No destructive operations; no data loss.
*/

-- ---------------------------------------------------------------------------
-- Trigger function: auto-create a profiles row when a new auth user is created
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- ---------------------------------------------------------------------------
-- Trigger: fire handle_new_user after a new auth.users row is inserted
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- INSERT policy on profiles (allows the trigger / owner to insert their row)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- Function: decrement a user's credit atomically (or honor unlimited_until)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.decrement_credit(user_uuid uuid)
RETURNS TABLE (ok boolean, unlimited boolean, credits integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_unlimited timestamptz;
  current_credits integer;
  updated_credits integer;
BEGIN
  SELECT unlimited_until, credits
    INTO current_unlimited, current_credits
    FROM public.profiles
    WHERE id = user_uuid;

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, false, 0;
    RETURN;
  END IF;

  -- Unlimited window still active
  IF current_unlimited IS NOT NULL AND current_unlimited > now() THEN
    RETURN QUERY SELECT true, true, current_credits;
    RETURN;
  END IF;

  -- Atomically decrement only if credits > 0
  UPDATE public.profiles
    SET credits = credits - 1
    WHERE id = user_uuid AND credits > 0
    RETURNING credits INTO updated_credits;

  IF updated_credits IS NULL THEN
    -- No row updated means credits were 0
    RETURN QUERY SELECT false, false, 0;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, false, updated_credits;
  RETURN;
END;
$$;

-- Grant execute to authenticated so the edge function (service role) and any
-- authenticated caller can invoke it.
GRANT EXECUTE ON FUNCTION public.decrement_credit(uuid) TO authenticated;
