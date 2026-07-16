/*
# Add user_id to submissions for per-user history

## Purpose
The submissions table currently stores all evaluations globally (single-tenant RLS).
To support a per-user "History" view in the Profile menu, each submission must be
attributed to the user who created it. This migration adds a `user_id` column and
tightens RLS so authenticated users can only read/write their own submissions.

## 1. Schema Changes
### `submissions`
- New column: `user_id uuid` (nullable initially so existing rows are not lost;
  the edge function will populate it for all new submissions).
- Foreign key to `auth.users(id) ON DELETE CASCADE` so submissions are removed
  if a user account is deleted.
- Added an index on `(user_id, created_at DESC)` to make the history query fast.

## 2. Security (RLS)
- RLS was already enabled; the old policies allowed anon + authenticated full CRUD
  (intentionally shared data). Now that submissions are per-user, we replace them
  with owner-scoped policies:
  - SELECT: authenticated users can read only rows where `auth.uid() = user_id`.
  - INSERT: authenticated users can insert only their own rows.
  - UPDATE/DELETE: authenticated, owner only.
- The edge function writes with the service-role client (bypasses RLS), so it is
  unaffected; it will pass `user_id` explicitly on insert.

## 3. Non-destructive
- `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` preserves all existing rows.
- Existing rows get `user_id = NULL` (they pre-date per-user tracking); they simply
  won't appear in any user's history, which is correct.
*/

-- Add user_id column (nullable so existing rows survive)
ALTER TABLE submissions
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- Index for the history query: user's submissions, newest first
CREATE INDEX IF NOT EXISTS submissions_user_created_idx
  ON submissions (user_id, created_at DESC);

-- Replace the old open policies with owner-scoped ones.
-- The edge function uses the service-role client, so RLS is bypassed for inserts.

DROP POLICY IF EXISTS "anon_select_submissions" ON submissions;
DROP POLICY IF EXISTS "anon_insert_submissions" ON submissions;
DROP POLICY IF EXISTS "anon_update_submissions" ON submissions;
DROP POLICY IF EXISTS "anon_delete_submissions" ON submissions;

CREATE POLICY "select_own_submissions" ON submissions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "insert_own_submissions" ON submissions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "update_own_submissions" ON submissions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "delete_own_submissions" ON submissions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
