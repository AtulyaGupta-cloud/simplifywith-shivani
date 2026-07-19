# Evalwell - Project Context for Claude Code

## What this is
Evalwell (branded "Evalwell - Simplify with Shivani") is an AI-powered web app that gives CBSE Class 12 English students instant, examiner-style feedback on their written answers. Built by Atulya, a BITS Pilani student.

Live at: https://simplifywith-shivani.vercel.app

## Tech stack
- Frontend: React + TypeScript + Tailwind CSS + Framer Motion
- 3D background: Vanta.js (NET effect) — chosen over Spline to avoid a paid watermark
- Backend: Supabase (Postgres + Auth + Edge Functions)
- AI: Google Gemini API (gemini-2.5-flash for generation, gemini-embedding-001 for embeddings) — free tier
- Auth: Supabase Auth with Google OAuth (via Google Cloud Console OAuth client)
- Payments: Razorpay Payment Pages + a webhook Edge Function for auto-crediting
- Hosting: Vercel, deployed from GitHub repo `AtulyaGupta-cloud/simplifywith-shivani`
- Ingestion: one-time Python/Colab script that reads chapter-wise PDFs/DOCX/PPTX/images, chunks them, generates embeddings, stores in Supabase (pgvector)

## Important workflow context
- Bolt.new was used originally to build the frontend, but **monthly token budget is often exhausted**. Going forward, code changes are done directly (via Claude Code now, previously via manual GitHub file edits).
- Deployment loop: GitHub push → Vercel auto-deploys (connected directly, no manual export needed anymore once Claude Code can push directly).
- The person is a **non-developer / beginner** — explanations should stay clear and step-by-step, but code itself can be as sophisticated as needed.

## Core product flow
1. Student clicks "Start Evaluating" → prompted to sign in with Google (Supabase Auth)
2. First-time login → asked for their name (onboarding), saved to `profiles` table
3. Input screen: student types/dictates (voice input via Web Speech API) the question text + selects marks (1-5, with a special "5 Marks — Writing Section" option for Notice/Letter/Article/Report) + types/dictates their answer
4. Submission calls the `evaluate-answer` Supabase Edge Function
5. Edge function: embeds the question → searches `material_chunks` via the `match_chunks` RPC (pgvector cosine similarity) → builds a marks-scaled system prompt → calls Gemini → returns structured JSON feedback
6. Feedback screen shows: score ring (X / selected marks), "What you nailed", "What was missing" (ALWAYS starts with a bolded "Keywords: **word1**, **word2**..." line), "How to improve", collapsible model answer, examiner's tip

## Database schema (Supabase, project ref `itxbnthhpaojcaylcxdx`)
- `chapters` — id, title (category names like "Chapters - The Last Lesson", "Writing - Notice", "General - Marking Schemes")
- `material_chunks` — id, chapter_id, source_file, content, embedding (vector(768)) — private to service-role RAG calls
- `submissions` — id, chapter_id, question_text, student_answer, ai_feedback (jsonb), score, max_score, created_at — RLS: insert-only, no public read
- `profiles` — id (matches auth.users id), name, email, credits (int, default 5), unlimited_until (timestamptz), created_at — RLS: user can only view/update own row
- All tables have RLS enabled (this was a real security issue Supabase flagged and we fixed — do NOT disable RLS on any table)

## Key Postgres functions
- `match_chunks(query_embedding vector(768), match_count int)` — returns top-N chunks by cosine similarity, searches the WHOLE library (no chapter filter — students don't pick a chapter, they just type their question and the RAG search finds relevant material automatically)
- `reserve_evaluation_credit`, `complete_evaluation_credit`, `refund_evaluation_credit` — service-role-only atomic reservation flow that prevents concurrent overspending and refunds failed evaluations.
- `fulfill_razorpay_payment` — service-role-only, idempotent payment fulfillment keyed by Razorpay payment ID.

## Edge Functions (in `supabase/functions/`)
- `evaluate-answer` — the main evaluation function. Key details:
  - Requires auth (Bearer token), verifies via `userClient.auth.getUser(jwt)` — the anon client must be created with `SUPABASE_ANON_KEY`, NOT the user's own token (this was a real bug we hit and fixed)
  - Atomically reserves a credit before AI work, refunds failures, and completes the reservation only after valid feedback is generated
  - Has a retry/fallback system: first attempt at full quality (8192 max output tokens), if that fails (parse error, cutoff, etc.) retries once with a more compact prompt; if both fail, returns a graceful `fallbackFeedback()` object instead of crashing
  - Marks-scaled depth guidance: different evaluation strictness for 1-2 marks (short answer) vs 3-4 marks vs 5 marks literature vs 5 marks writing-format (checks Notice/Letter/Article/Report format conventions specifically)
  - System prompt MANDATES the first "missingPoints" item always be a bolded "Keywords: **x**, **y**..." line
  - Logs every submission to the `submissions` table (non-blocking, wrapped in try/catch so logging failures don't break the response)
- `razorpay-webhook` — has gateway JWT verification disabled because Razorpay cannot send Supabase JWTs; it requires HMAC verification, enforces payload limits, and uses idempotent atomic fulfillment: ₹39→+15 credits, ₹99→+50 credits, ₹199→60-day unlimited_until

## Known gotchas / things to watch for
- `SUPABASE_ANON_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `RAZORPAY_WEBHOOK_SECRET` are all set as Edge Function secrets in Supabase — never hardcode these
- When editing TypeScript `as` type casts, be careful with `|` — writing `(X as Type) | null` is bitwise OR at runtime (real bug we hit), correct syntax is `X as (Type | null)`
- The frontend calls the edge function via `supabase.functions.invoke()`, NOT raw fetch — this is what automatically attaches the user's session token
- Gemini free tier: gemini-2.5-flash and gemini-embedding-001, rate limits exist (~1500 req/day), ingestion script has retry-with-backoff for 429s

## SEO / marketing status
- Google Search Console + Bing Webmaster Tools both verified, sitemap submitted, IndexNow pinged
- Site is confirmed indexed on Google (`site:simplifywith-shivani.vercel.app` returns results)
- Has one SEO content page: `/notice-writing-guide.html` (static HTML, not part of the React app, lives in `public/`)
- Marketing angle: positioned against generic AI ("Why not Claude/ChatGPT/Gemini?" comparison section on landing page) — emphasizes RAG grounding in real CBSE material, marks-calibrated scoring, keyword-detection, format-checking
- Landing page footer credits "Shivani Gupta — 25+ years experienced CBSE examiner/educator" (this is the persona/brand, not necessarily a literal separate person — treat as established brand voice)

## Business model
- Credit system: 5 free credits on signup, then paid packs via Razorpay Payment Pages:
  - 15 credits — ₹39 (https://rzp.io/rzp/RiTqN42)
  - 50 credits — ₹99 (https://rzp.io/rzp/KZ5iDYaW)
  - Unlimited 60 days — ₹199 (https://rzp.io/rzp/d4dCtZAV)
- These links are hardcoded in the frontend's pricing/out-of-credits screens

## Service recovery
- Migration `20260719170000_compensate_all_profiles_five_credits.sql` granted every existing profile five additional credits once, compensating users for credits consumed by the previous pre-evaluation charging bug.

## Tone/style preferences for this project
- Keep the glassmorphic dark theme (violet/cyan gradient accents) consistent across any new UI
- Mobile responsiveness matters a lot — this project had real mobile clutter issues with the Vanta background and comparison table that were fixed with careful `sm:` breakpoint tuning; be careful not to regress this
- The person prefers being told exactly what to click/paste, step by step, when the task involves non-code tools (Supabase dashboard, Vercel dashboard, Razorpay, Google Cloud Console, GitHub web UI)
