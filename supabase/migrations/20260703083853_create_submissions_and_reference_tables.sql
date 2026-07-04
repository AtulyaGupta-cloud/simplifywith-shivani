/*
# ScoreWise: submissions table + reference material chunks + match_chunks function

## Purpose
ScoreWise is an AI-powered answer evaluator for CBSE Class 12 English students.
This migration creates the database schema to:
1. Store student submissions (question, answer, AI feedback, score) for future reference.
2. Store reference material chunks (textbook content, mark schemes, model answers) with vector embeddings.
3. Provide a `match_chunks` Postgres function for semantic retrieval of relevant reference material.

## 1. New Tables

### `submissions`
- `id` (uuid, primary key) — unique submission ID
- `question_text` (text, not null) — the exam question the student answered
- `student_answer` (text, not null) — the student's written answer
- `feedback` (jsonb) — the full AI feedback JSON (covered points, missing points, suggestions, model answer, tip)
- `score` (integer) — numeric score awarded
- `max_score` (integer) — maximum possible score for this question
- `created_at` (timestamptz) — when the submission was created

### `reference_chunks`
- `id` (uuid, primary key) — unique chunk ID
- `content` (text, not null) — the reference text content (chapter excerpt, mark scheme, model answer, etc.)
- `source` (text) — source label (e.g. "The Tiger King - Chapter Notes", "CBSE Marking Scheme 2023")
- `question_type` (text) — type of question this chunk relates to (e.g. "literature_long", "formal_writing")
- `max_marks` (integer) — suggested max marks for this question type, if known
- `embedding` (vector(768)) — Gemini embedding vector for semantic search
- `created_at` (timestamptz) — when the chunk was created

## 2. Indexes
- `reference_chunks_embedding_idx` — IVFFLAT index on the embedding column for fast vector similarity search

## 3. Functions

### `match_chunks(query_embedding vector(768), match_count integer)`
- Performs cosine similarity search against `reference_chunks`
- Returns the top `match_count` chunks ordered by similarity (highest first)
- Returns: id, content, source, question_type, max_marks, and similarity score
- This is called by the `evaluate-answer` Edge Function to retrieve relevant reference material

## 4. Security (RLS)
- `submissions`: single-tenant app (no sign-in), so anon + authenticated have full CRUD. Data is intentionally shared.
- `reference_chunks`: read-only for anon + authenticated (reference material is system-managed, not user-editable).

## 5. Extensions
- Requires `vector` extension (pgvector) for embedding storage and similarity search.
*/

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text text NOT NULL,
  student_answer text NOT NULL,
  feedback jsonb,
  score integer,
  max_score integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_submissions" ON submissions;
CREATE POLICY "anon_select_submissions" ON submissions FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_submissions" ON submissions;
CREATE POLICY "anon_insert_submissions" ON submissions FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_submissions" ON submissions;
CREATE POLICY "anon_update_submissions" ON submissions FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_submissions" ON submissions;
CREATE POLICY "anon_delete_submissions" ON submissions FOR DELETE
  TO anon, authenticated USING (true);

-- Reference chunks table
CREATE TABLE IF NOT EXISTS reference_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content text NOT NULL,
  source text,
  question_type text,
  max_marks integer,
  embedding vector(768),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE reference_chunks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_reference_chunks" ON reference_chunks;
CREATE POLICY "anon_select_reference_chunks" ON reference_chunks FOR SELECT
  TO anon, authenticated USING (true);

-- IVFFLAT index for fast vector similarity search
-- lists = 100 is a reasonable default for up to ~100k rows
CREATE INDEX IF NOT EXISTS reference_chunks_embedding_idx
  ON reference_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- match_chunks function: semantic retrieval of reference material
CREATE OR REPLACE FUNCTION match_chunks(query_embedding vector(768), match_count integer DEFAULT 8)
RETURNS TABLE (
  id uuid,
  content text,
  source text,
  question_type text,
  max_marks integer,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    rc.id,
    rc.content,
    rc.source,
    rc.question_type,
    rc.max_marks,
    1 - (rc.embedding <=> query_embedding) AS similarity
  FROM reference_chunks rc
  ORDER BY rc.embedding <=> query_embedding
  LIMIT match_count;
$$;