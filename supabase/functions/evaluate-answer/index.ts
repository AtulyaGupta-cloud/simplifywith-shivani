import { createClient } from "npm:@supabase/supabase-js@2";

const baseCorsHeaders = {
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
  "Vary": "Origin",
};

function corsHeadersFor(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin");
  const allowed = origin === "https://simplifywith-shivani.vercel.app" ||
    !!origin?.match(/^http:\/\/(localhost|127\.0\.0\.1):\d+$/);
  return allowed && origin
    ? { ...baseCorsHeaders, "Access-Control-Allow-Origin": origin }
    : baseCorsHeaders;
}

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const EMBEDDING_MODEL = "gemini-embedding-001";
const GENERATION_MODEL = "gemini-2.5-flash"; // FIXED: Was duplicated
const MAX_QUESTION_LENGTH = 2_000;
const MAX_ANSWER_LENGTH = 12_000;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

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
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${EMBEDDING_MODEL}:embedContent?key=${GEMINI_API_KEY}`;
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
  let depthGuidance = "";
  if (marks <= 2) {
    depthGuidance = `## Marking Scale: ${marks} Mark${
      marks > 1 ? "s" : ""
    } (Short Answer)
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

  const systemInstruction =
    `You are a strict but encouraging CBSE Class 12 English examiner with 15+ years of experience evaluating board exam answer sheets. You deeply understand the CBSE marking scheme, question patterns, and what earns marks versus what loses them.

${referenceSection}

${depthGuidance}

## Your Task
Evaluate the student's answer against the reference material and CBSE marking standards. Be specific, constructive, and warm in tone — the student should feel guided, not judged.

## Evaluation Guidelines
1. The max marks for this question is ${marks}. You MUST return exactly ${marks} as "maxScore" in the JSON — never infer, change, or override this value.
2. Award a score (0 to ${marks}) that reflects how completely and accurately the answer addresses the question, scaled to the marking guidance above.
3. Identify specific points the student covered well ("What you nailed").
4. Identify specific points that were missing or underdeveloped ("What was missing").${
      isWritingFormat
        ? " Include missing FORMAT elements as separate items here."
        : ""
    }
5. Provide concrete, actionable rewrite suggestions ("How to improve") — not generic advice but specific changes the student can make.
6. Write an ideal/model answer that would earn full marks — examiner-quality, well-structured, and complete.${
      isWritingFormat
        ? " The model answer must demonstrate the correct format for the writing type."
        : ""
    }
7. Give one short, encouraging, specific tip in the "Examiner's tip" that the student can apply to future answers.

${
      !hasReferenceMaterial
        ? "Since no specific chapter material was found, note in the examiner's tip that the evaluation is based on general CBSE writing standards rather than specific chapter material."
        : ""
    }

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

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${GENERATION_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
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
  } catch (error) {
    throw new Error(
      `Failed to parse Gemini JSON output: ${errorMessage(error)}. Raw: ${
        cleaned.substring(0, 200)
      }`,
    );
  }

  // Validate shape
  if (
    typeof parsed.score !== "number" ||
    typeof parsed.maxScore !== "number" ||
    !Array.isArray(parsed.coveredPoints) ||
    !Array.isArray(parsed.missingPoints) ||
    !Array.isArray(parsed.improvementSuggestions) ||
    typeof parsed.modelAnswer !== "string" ||
    typeof parsed.examinerTip !== "string"
  ) {
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
  } catch (error) {
    // Non-blocking — log but don't fail the response
    console.error("Failed to log submission:", errorMessage(error));
  }
}

Deno.serve(async (req: Request) => {
  const corsHeaders = corsHeadersFor(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({
          error:
            "Gemini API key is not configured. Please set the GEMINI_API_KEY secret.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
      return new Response(
        JSON.stringify({
          error: "Required Supabase environment variables are not configured.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
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
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const userClient = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const jwt = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await userClient.auth.getUser(
      jwt,
    );
    if (userError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Authentication required." }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    const userId = userData.user.id;

    // ------------------------------------------------------------------
    // Shared Supabase admin client for profile check and credit operations
    // ------------------------------------------------------------------
    const adminClient = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Ensure profile exists - create if missing with default credits
    const profileCheck = await adminClient
      .from("profiles")
      .select("credits, unlimited_until")
      .eq("id", userId)
      .single();

    if (profileCheck.error && profileCheck.error.code === "PGRST116") {
      // PGRST116 means no rows returned (not found)
      const { error: createError } = await adminClient
        .from("profiles")
        .insert({
          id: userId,
          email: userData.user.email || "", // Use email from auth user if available
          credits: 5, // Default starting credits
          unlimited_until: null,
        });
      if (createError) {
        return new Response(
          JSON.stringify({
            error: "Could not create profile. Please try again.",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    } else if (profileCheck.error) {
      // Some other error occurred
      return new Response(
        JSON.stringify({
          error: "Could not verify profile. Please try again.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    } else {
      // Profile exists - check if credits need initialization (handles cases where profile was created without credits)
      if (profileCheck.data && profileCheck.data.credits === null) {
        const { error: initializeError } = await adminClient
          .from("profiles")
          .update({ credits: 5 })
          .eq("id", userId);
        if (initializeError) {
          return new Response(
            JSON.stringify({
              error: "Could not initialize credits. Please try again.",
            }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            },
          );
        }
      }
      // If profile exists with valid credits, we continue
    }

    const body = await req.json();
    const { questionText, studentAnswer, marks, isWritingFormat } = body;

    if (
      !questionText || typeof questionText !== "string" ||
      questionText.trim().length < 5
    ) {
      return new Response(
        JSON.stringify({ error: "A valid question is required." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (questionText.length > MAX_QUESTION_LENGTH) {
      return new Response(
        JSON.stringify({
          error:
            `Question is too long (maximum ${MAX_QUESTION_LENGTH} characters); ask bigger questions in parts.`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (
      !studentAnswer || typeof studentAnswer !== "string" ||
      studentAnswer.trim().length < 10
    ) {
      return new Response(
        JSON.stringify({
          error: "Please write a more complete answer before submitting.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (studentAnswer.length > MAX_ANSWER_LENGTH) {
      return new Response(
        JSON.stringify({
          error:
            `Answer is too long (maximum ${MAX_ANSWER_LENGTH} characters); ask bigger questions in parts.`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (typeof marks !== "number" || ![1, 2, 3, 4, 5].includes(marks)) {
      return new Response(
        JSON.stringify({ error: "A valid marks selection is required." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const writingFormat = Boolean(isWritingFormat);

    // Atomically reserve capacity before making paid AI calls. Concurrent
    // requests cannot spend beyond the user's balance, and failures refund it.
    const reservationId = crypto.randomUUID();
    const { data: reservationData, error: reservationError } = await adminClient
      .rpc("reserve_evaluation_credit", {
        p_user_id: userId,
        p_request_id: reservationId,
      });
    type ReservationResult = {
      ok: boolean;
      unlimited: boolean;
      credits: number;
    };
    const reservation = Array.isArray(reservationData)
      ? (reservationData[0] as ReservationResult | undefined)
      : (reservationData as ReservationResult | null);
    if (reservationError || !reservation?.ok) {
      return new Response(
        JSON.stringify({
          error: reservationError
            ? "Could not reserve credit. Please try again."
            : "out_of_credits",
        }),
        {
          status: reservationError ? 500 : 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const refundReservation = async () => {
      const { error } = await adminClient.rpc("refund_evaluation_credit", {
        p_user_id: userId,
        p_request_id: reservationId,
      });
      if (error) {
        console.error("Failed to refund credit reservation:", error.message);
      }
    };

    // Step 1: Generate embedding for the question
    let queryEmbedding: number[];
    try {
      queryEmbedding = await generateEmbedding(questionText);
    } catch (error) {
      await refundReservation();
      return new Response(
        JSON.stringify({
          error: `Failed to generate question embedding: ${
            errorMessage(error)
          }`,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Step 2: Retrieve relevant reference chunks
    let referenceChunks: MatchedChunk[] = [];
    let hasReferenceMaterial = false;
    let bestChapterId: string | null = null;
    try {
      referenceChunks = await matchReferenceChunks(queryEmbedding, 8);
      // Consider material relevant if top similarity is above a threshold
      hasReferenceMaterial = referenceChunks.length > 0 &&
        referenceChunks[0].similarity > 0.65;
      if (hasReferenceMaterial) {
        bestChapterId = referenceChunks[0].chapter_id;
      }
    } catch (error) {
      await refundReservation();
      // Continue without reference material — evaluate on general standards
      console.error("match_chunks failed:", errorMessage(error));
    }

    // Step 3: Build reference context
    const referenceContext = hasReferenceMaterial
      ? referenceChunks
        .slice(0, 5)
        .map((c, i) =>
          `[${i + 1}] (Source: ${c.source_file || "unknown"})\n${c.content}`
        )
        .join("\n\n")
      : "";

    // Step 4: Generate feedback via Gemini
    let feedback: Feedback;
    try {
      feedback = await generateFeedback(
        referenceContext,
        questionText,
        studentAnswer,
        hasReferenceMaterial,
        marks,
        writingFormat,
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: `Failed to generate feedback: ${errorMessage(error)}`,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Force maxScore to the student-selected value — never trust AI inference
    feedback.maxScore = marks;
    // Clamp score to valid range
    if (feedback.score < 0) feedback.score = 0;
    if (feedback.score > marks) feedback.score = marks;

    const { data: completed, error: completionError } = await adminClient.rpc(
      "complete_evaluation_credit",
      { p_user_id: userId, p_request_id: reservationId },
    );
    if (completionError || completed !== true) {
      await refundReservation();
      return new Response(
        JSON.stringify({
          error: "Could not finalize credit. Please try again.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Step 5: Log submission (non-blocking)
    await logSubmission(
      questionText,
      studentAnswer,
      feedback,
      bestChapterId,
      userId,
    );

    return new Response(
      JSON.stringify(feedback),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Something went wrong: ${errorMessage(error)}` }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
