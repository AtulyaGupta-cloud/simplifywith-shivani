/*
 * One-time service recovery credit.
 *
 * The evaluation function previously consumed credits before returning a
 * successful evaluation. Add five credits to every existing profile to
 * compensate affected users. Supabase migration history guarantees this runs
 * only once per environment.
 */
UPDATE public.profiles
SET credits = COALESCE(credits, 0) + 5;
