import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const RAZORPAY_WEBHOOK_SECRET = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
const MAX_WEBHOOK_BYTES = 1_000_000;

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function hexToBytes(hex: string): Uint8Array | null {
  if (!/^[a-f\d]{64}$/i.test(hex)) return null;
  return new Uint8Array(
    hex.match(/.{2}/g)!.map((byte) => Number.parseInt(byte, 16)),
  );
}

async function verifySignature(
  body: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  const signatureBytes = hexToBytes(signature);
  if (!signatureBytes) return false;
  const signatureBuffer = new ArrayBuffer(signatureBytes.byteLength);
  new Uint8Array(signatureBuffer).set(signatureBytes);
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );
  return crypto.subtle.verify(
    "HMAC",
    key,
    signatureBuffer,
    new TextEncoder().encode(body),
  );
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !RAZORPAY_WEBHOOK_SECRET) {
    console.error("Razorpay webhook secrets are not configured.");
    return json({ error: "Server configuration error" }, 500);
  }

  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > MAX_WEBHOOK_BYTES) {
    return json({ error: "Payload too large" }, 413);
  }

  const rawBody = await req.text();
  if (rawBody.length > MAX_WEBHOOK_BYTES) {
    return json({ error: "Payload too large" }, 413);
  }

  const signature = req.headers.get("x-razorpay-signature") ?? "";
  if (!(await verifySignature(rawBody, signature, RAZORPAY_WEBHOOK_SECRET))) {
    return json({ error: "Invalid signature" }, 401);
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  if (payload.event !== "payment.captured") {
    return json({ ok: true, ignored: true });
  }

  const payment = (payload as {
    payload?: { payment?: { entity?: Record<string, unknown> } };
  }).payload?.payment?.entity;
  const paymentId = payment?.id;
  const amount = payment?.amount;
  const notes = payment?.notes as Record<string, unknown> | undefined;
  const email = payment?.email || notes?.email;

  if (
    typeof paymentId !== "string" || typeof amount !== "number" ||
    typeof email !== "string"
  ) {
    return json({ error: "Missing payment details" }, 400);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: result, error } = await supabase.rpc(
    "fulfill_razorpay_payment",
    {
      p_payment_id: paymentId,
      p_email: email.trim().toLowerCase(),
      p_amount_paise: amount,
    },
  );

  if (error) {
    console.error("Payment fulfillment failed:", error.message);
    return json({ error: "Payment fulfillment failed" }, 500);
  }
  if (result === "profile_not_found") {
    return json({ error: "No matching user" }, 404);
  }
  if (result === "invalid") return json({ error: "Unsupported payment" }, 400);

  return json({ ok: true, duplicate: result === "duplicate" });
});
