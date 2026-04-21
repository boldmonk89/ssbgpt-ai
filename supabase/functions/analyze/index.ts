import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Try these models in order. If the first hits quota (429), we fall back to the next.
const MODEL_FALLBACKS = [
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
];

function ok(payload: Record<string, unknown>) {
  // ALWAYS return HTTP 200 so the client can read the body, even on logical errors.
  return new Response(JSON.stringify({ ok: true, ...payload }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function fail(error: string, extra: Record<string, unknown> = {}) {
  return new Response(JSON.stringify({ ok: false, error, ...extra }), {
    status: 200, // intentional — keep 200 so supabase.functions.invoke surfaces the body
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function callGemini(
  model: string,
  apiKey: string,
  parts: Record<string, unknown>[],
) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ role: "user", parts }] }),
  });
  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { /* keep raw */ }
  return { status: res.status, ok: res.ok, json, raw: text };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return fail("Invalid JSON body");
    }

    const { prompt, files } = body || {};
    const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
    if (!GEMINI_API_KEY) {
      return fail("Server configuration error: GEMINI_API_KEY missing.");
    }

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return fail("No prompt provided");
    }

    const parts: Record<string, unknown>[] = [{ text: prompt }];
    if (files && Array.isArray(files)) {
      for (const f of files) {
        if (!f?.base64 || !f?.mimeType) continue;
        parts.push({
          inline_data: { mime_type: f.mimeType, data: f.base64 },
        });
      }
    }

    let lastErrorMessage = "Unknown Gemini error";
    let lastStatus = 500;

    for (const model of MODEL_FALLBACKS) {
      const result = await callGemini(model, GEMINI_API_KEY, parts);

      if (result.ok) {
        const text =
          result.json?.candidates?.[0]?.content?.parts
            ?.map((p: { text?: string }) => p?.text ?? "")
            .join("") || "";

        if (!text) {
          // Model responded but empty — try next fallback
          lastErrorMessage = "Empty response from model";
          lastStatus = 502;
          continue;
        }

        return ok({ result: text, model });
      }

      // Not ok — capture and decide
      const apiMsg =
        result.json?.error?.message ||
        result.raw?.slice(0, 500) ||
        `HTTP ${result.status}`;
      lastErrorMessage = apiMsg;
      lastStatus = result.status;

      console.error(`Gemini ${model} failed (${result.status}):`, apiMsg);

      // Only retry next model on quota / rate-limit / server errors.
      // For 400 (bad request) / 401-403 (auth) → no point trying other models.
      if (result.status !== 429 && result.status < 500) {
        break;
      }
    }

    // All models failed — return a friendly, actionable message
    if (lastStatus === 429 || /quota|exceeded|rate/i.test(lastErrorMessage)) {
      return fail(
        "Gemini API quota exceeded for your key. Enable billing on your Google Cloud project (https://aistudio.google.com/app/apikey) or wait for the daily reset.",
        { code: "QUOTA_EXCEEDED", upstreamStatus: lastStatus },
      );
    }
    if (lastStatus === 401 || lastStatus === 403) {
      return fail(
        "Invalid Gemini API key. Please update GEMINI_API_KEY in your project secrets.",
        { code: "AUTH_FAILED", upstreamStatus: lastStatus },
      );
    }

    return fail(`Gemini API error: ${lastErrorMessage}`, {
      code: "UPSTREAM_ERROR",
      upstreamStatus: lastStatus,
    });
  } catch (e) {
    console.error("analyze error:", e);
    return fail(e instanceof Error ? e.message : "Unknown error", {
      code: "UNCAUGHT",
    });
  }
});
