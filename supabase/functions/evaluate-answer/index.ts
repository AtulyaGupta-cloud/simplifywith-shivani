import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const EMBEDDING_MODEL = "gemini-embedding-001";
const GENERATION_MODEL = "gemini-2.5-flash";

interface Feedback {
  score: number;
  maxScore: number;
  coveredPoints: string[];
  missingPoints: string[];
  improvementSuggestions: string[];
  modelAnswer: string;
  examinerTip: string;
}

function stripCodeFences(text: string): string {
  let cleaned = text.trim();
  // Remove leading ```json or ``` and trailing ```
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  return cleaned.trim();
}

async function generateEmbedding(text: string): Promise<number[]> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: `models/${EMBEDDING_MODEL}`,
      content: { parts: [{ text }] },
      taskType: "RETRIEVAL_DOCUMENT",
      outputDimensionality: 768,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini embedding API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const embedding = data?.embedding?.values;
  if (!embedding || !Array.isArray(embedding)) {
    throw new Error("Gemini embedding returned no vector data");
  }
  return embedding;
}

interface MatchedChunk {
  content: string;
  source_file: string | null;
  chapter_id: string | null;
  similarity: number;
}

async function matchReferenceChunks(
  queryEmbedding: number[],
  matchCount: number,
): Promise<MatchedChunk[]> {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
  const { data, error } = await supabase.rpc("match_chunks", {
    query_embedding: queryEmbedding,
    match_count: matchCount,
  });

  if (error) {
    throw new Error(`match_chunks RPC error: ${error.message}`);
  }
  return (data as MatchedChunk[]) || [];
}

async function generateFeedback(
  referenceContext: string,
  questionText: string,
  studentAnswer: string,
  hasReferenceMaterial: boolean,
  marks: number,
  isWritingFormat: boolean,
): Promise<Feedback> {
  const referenceSection = hasReferenceMaterial
    ? `## Reference Material (from CBSE Class 12 English textbook and marking schemes)
${referenceContext}

Use this reference material to evaluate the student's answer against the expected content. The max marks for this question is ${marks} (selected by the student) — do NOT change this value.`
    : `## Reference Material
No specific chapter material was found for this question. Evaluate based on general CBSE Class 12 English writing standards and mark schemes. The max marks for this question is ${marks} (selected by the student) — do NOT change this value.`;

  // Scale evaluation depth by mark value
  let depthGuidance = '';
  if (marks <= 2) {
    depthGuidance = `## Marking Scale: ${marks} Mark${marks > 1 ? 's' : ''} (Short Answer)
This is a low-mark question. Expect a short, precise, factual answer of 1-3 sentences.
- Focus on accuracy and precision, NOT depth or elaboration.
- A correct, concise answer should score full marks.
- Do NOT penalize the student for lacking the depth expected of a 5-mark answer.
- Do NOT over-reward a brief answer that happens to be correct — if key facts are missing, deduct marks proportionally.`;
  } else if (marks === 3) {
    depthGuidance = `## Marking Scale: 3 Marks (Short-Medium Answer)
Expect a focused paragraph covering 3-4 key points.
- The answer should be concise but cover the main points.
- Do NOT expect the elaboration or examples of a 5-mark answer.
- Deduct marks for missing key points, not for brevity.`;
  } else if (marks === 4) {
    depthGuidance = `## Marking Scale: 4 Marks (Medium Answer)
Expect a well-developed paragraph covering most key points with some elaboration.
- The answer should show understanding with some supporting detail.
- Do NOT require the full structure or all key points of a 5-mark answer.
- Deduct marks for missing key points or lack of elaboration.`;
  } else if (marks === 5 && !isWritingFormat) {
    depthGuidance = `## Marking Scale: 5 Marks (Literature — Long Answer)
Expect a full, well-structured answer covering ALL key points.
- The answer should use specific keywords/terms from the marking scheme.
- The answer should include examples/references from the text.
- Deduct marks for missing key points, lack of text references, or poor structure.
- Do NOT give full marks if the answer is too brief or lacks textual evidence.`;
  } else if (marks === 5 && isWritingFormat) {
    depthGuidance = `## Marking Scale: 5 Marks (Writing Section — Format-Based)
This is a writing-section question (Notice, Letter, Article, or Report). The answer must follow correct FORMAT conventions IN ADDITION to content.
- Notice: must have a heading/title, a box around the content, date, and issuing authority/signature.
- Letter: must have sender's address, date, receiver's address, subject line, salutation, body, and formal closing.
- Article: must have a title, byline, and structured paragraphs (intro, body, conclusion).
- Report: must have a heading, date, and structured body.
- In the "missingPoints" array, explicitly call out any missing FORMAT elements as separate items (e.g. "Missing: Notice heading/title", "Missing: Sender's address in letter").
- Deduct marks for both missing content points AND missing format elements.
- The model answer must demonstrate the correct format for the writing type.`;
  }

  const systemInstruction = `You are a strict but encouraging CBSE Class 12 English examiner with 15+ years of experience evaluating board exam answer sheets. You deeply understand the CBSE marking scheme, question patterns, and what earns marks versus what loses them.

${referenceSection}

${depthGuidance}

## Your Task
Evaluate the student's answer against the reference material and CBSE marking standards. Be specific, constructive, and warm in tone — the student should feel guided, not judged.

## Evaluation Guidelines
1. The max marks for this question is ${marks}. You MUST return exactly ${marks} as "maxScore" in the JSON — never infer, change, or override this value.
2. Award a score (0 to ${marks}) that reflects how completely and accurately the answer addresses the question, scaled to the marking guidance above.
3. Identify specific points the student covered well ("What you nailed").
4. Identify specific points that were missing or underdeveloped ("What was missing").${isWritingFormat ? ' Include missing FORMAT elements as separate items here.' : ''}
5. Provide concrete, actionable rewrite suggestions ("How to improve") — not generic advice but specific changes the student can make.
6. Write an ideal/model answer that would earn full marks — examiner-quality, well-structured, and complete.${isWritingFormat ? ' The model answer must demonstrate the correct format for the writing type.' : ''}
7. Give one short, encouraging, specific tip in the "Examiner's tip" that the student can apply to future answers.

${!hasReferenceMaterial ? "Since no specific chapter material was found, note in the examiner's tip that the evaluation is based on general CBSE writing standards rather than specific chapter material." : ""}

## Output Format
Return ONLY valid JSON. No markdown formatting, no code fences, no commentary before or after. The JSON must match this exact shape:
{
  "score": number,
  "maxScore": number,
  "coveredPoints": string[],
  "missingPoints": string[],
  "improvementSuggestions": string[],
  "modelAnswer": string,
  "examinerTip": string
}`;

  const userPrompt = `## Question
${questionText}

## Student's Answer
${studentAnswer}

Now evaluate this answer and return ONLY the JSON object.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GENERATION_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ parts: [{ text: userPrompt }] }],
      generationConfig: {
        temperature: 0.4,
        topP: 0.9,
        maxOutputTokens: 2048,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini generation API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error("Gemini returned no content");
  }

  const cleaned = stripCodeFences(rawText);
  let parsed: Feedback;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`Failed to parse Gemini JSON output: ${e.message}. Raw: ${cleaned.substring(0, 200)}`);
  }

  // Validate shape
  if (typeof parsed.score !== "number" || typeof parsed.maxScore !== "number" ||
      !Array.isArray(parsed.coveredPoints) || !Array.isArray(parsed.missingPoints) ||
      !Array.isArray(parsed.improvementSuggestions) ||
      typeof parsed.modelAnswer !== "string" || typeof parsed.examinerTip !== "string") {
    throw new Error("Gemini output did not match expected JSON shape");
  }

  return parsed;
}

async function logSubmission(
  questionText: string,
  studentAnswer: string,
  feedback: Feedback,
  chapterId: string | null,
  userId: string,
): Promise<void> {
  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    await supabase.from("submissions").insert({
      question_text: questionText,
      student_answer: studentAnswer,
      ai_feedback: feedback,
      score: feedback.score,
      max_score: feedback.maxScore,
      chapter_id: chapterId,
      user_id: userId,
    });
  } catch (e) {
    // Non-blocking — log but don't fail the response
    console.error("Failed to log submission:", e.message);
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Gemini API key is not configured. Please set the GEMINI_API_KEY secret." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ------------------------------------------------------------------
    // Auth: require a valid user JWT. The Supabase functions.invoke client
    // forwards the user's access token in the Authorization header.
    // ------------------------------------------------------------------
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentication required." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const jwt = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await userClient.auth.getUser(jwt);
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Authentication required." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const userId = userData.user.id;

    // ------------------------------------------------------------------
    // Shared Supabase admin client for profile check and credit operations
    // ------------------------------------------------------------------
    const adminClient = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Ensure profile exists - create if missing with default credits
    const profileCheck = await adminClient
      .from('profiles')
      .select('credits, unlimited_until')
      .eq('id', userId)
      .single();

    if (profileCheck.error && profileCheck.error.code === 'PGRST116') {
      // PGRST116 means no rows returned (not found)
      await adminClient
        .from('profiles')
        .insert({
          id: userId,
          email: userData.user.email || '', // Use email from auth user if available
          credits: 5, // Default starting credits
          unlimited_until: null
        });
    } else if (profileCheck.error) {
      // Some other error occurred
      return new Response(
        JSON.stringify({ error: "Could not verify profile. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    // If profile exists, profileCheck.data will have the values and we continue

    // ------------------------------------------------------------------
    // Credits: atomically check + decrement via the decrement_credit RPC.
    // Returns 402 out_of_credits when the user has no credits and no
    // active unlimited window.
    // ------------------------------------------------------------------
    const { data: creditData, error: creditError } = await adminClient.rpc("decrement_credit", {
      user_uuid: userId,
    });
    if (creditError) {
      return new Response(
        JSON.stringify({ error: "Could not verify credits. Please try again." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const creditResult = (creditData as { ok: boolean; unlimited: boolean; credits: number }) | null;
    if (!creditResult || !creditResult.ok) {
      return new Response(
        JSON.stringify({ error: "out_of_credits" }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    const { questionText, studentAnswer, marks, isWritingFormat } = body;

    if (!questionText || typeof questionText !== "string" || questionText.trim().length < 5) {
      return new Response(
        JSON.stringify({ error: "A valid question is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (!studentAnswer || typeof studentAnswer !== "string" || studentAnswer.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "Please write a more complete answer before submitting." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (typeof marks !== "number" || ![1, 2, 3, 4, 5].includes(marks)) {
      return new Response(
        JSON.stringify({ error: "A valid marks selection is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const writingFormat = Boolean(isWritingFormat);

    // Step 1: Generate embedding for the question
    let queryEmbedding: number[];
    try {
      queryEmbedding = await generateEmbedding(questionText);
    } catch (e) {
      return new Response(
        JSON.stringify({ error: `Failed to generate question embedding: ${e.message}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Step 2: Retrieve relevant reference chunks
    let referenceChunks: MatchedChunk[] = [];
    let hasReferenceMaterial = false;
    let bestChapterId: string | null = null;
    try {
      referenceChunks = await matchReferenceChunks(queryEmbedding, 8);
      // Consider material relevant if top similarity is above a threshold
      hasReferenceMaterial = referenceChunks.length > 0 && referenceChunks[0].similarity > 0.65;
      if (hasReferenceMaterial) {
        bestChapterId = referenceChunks[0].chapter_id;
      }
    } catch (e) {
      // Continue without reference material — evaluate on general standards
      console.error("match_chunks failed:", e.message);
    }

    // Step 3: Build reference context
    const referenceContext = hasReferenceMaterial
      ? referenceChunks
          .slice(0, 5)
          .map((c, i) => `[${i + 1}] (Source: ${c.source_file || "unknown"})\n${c.content}`)
          .join("\n\n")
      : "";

    // Step 4: Generate feedback via Gemini
    let feedback: Feedback;
    try {
      feedback = await generateFeedback(referenceContext, questionText, studentAnswer, hasReferenceMaterial, marks, writingFormat);
    } catch (e) {
      return new Response(
        JSON.stringify({ error: `Failed to generate feedback: ${e.message}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Force maxScore to the student-selected value — never trust AI inference
    feedback.maxScore = marks;
    // Clamp score to valid range
    if (feedback.score < 0) feedback.score = 0;
    if (feedback.score > marks) feedback.score = marks;

    // Step 5: Log submission (non-blocking)
    await logSubmission(questionText, studentAnswer, feedback, bestChapterId, userId);

    return new Response(
      JSON.stringify(feedback),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: `Something went wrong: ${err.message}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});%   
