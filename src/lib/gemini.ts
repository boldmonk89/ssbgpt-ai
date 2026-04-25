import { supabase } from "@/integrations/supabase/client";
import { 
  SYSTEM_PROMPT_TAT, 
  SYSTEM_PROMPT_WAT, 
  SYSTEM_PROMPT_SRT, 
  SYSTEM_PROMPT_PPDT 
} from "./prompts";
import { GIBBERISH_GUARD_INSTRUCTION } from "./gibberishDetector";

export interface FilePart {
  base64: string;
  mimeType: string;
}

// Simple hash for cache keys
function hashKey(input: string): string {
  let hash = 0;
  for (let i = 0; i < Math.min(input.length, 500); i++) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  return 'ai_cache_' + Math.abs(hash).toString(36);
}

function cacheResult(key: string, result: string) {
  try { localStorage.setItem(key, JSON.stringify({ result, ts: Date.now() })); } catch { /* Ignore quota errors or private mode */ }
}

function getCachedResult(key: string): string | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw).result || null;
  } catch { return null; }
}

/**
 * Ensures the result is clean of common AI artifacts like markdown bolding/italics
 */
function cleanOutput(text: string): string {
  return text.replace(/\*/g, '').trim();
}

async function callGeminiDirectly(prompt: string, files?: FilePart[]): Promise<string> {
  const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to your .env file.');
  }

  if (!navigator.onLine) {
    const cached = getCachedResult(hashKey(prompt));
    if (cached) return cached + '\n\n---\n*⚠️ Showing cached result (offline)*';
    throw new Error('You are offline. AI analysis requires an internet connection.');
  }

  const parts: any[] = [{ text: prompt }];

  if (files && Array.isArray(files)) {
    for (const f of files) {
      parts.push({
        inline_data: {
          mime_type: f.mimeType,
          data: f.base64.replace(/^data:[^;]+;base64,/, ''),
        },
      });
    }
  }

  try {
    const model = "gemini-1.5-flash"; // Switched to 1.5-flash for maximum stability and availability
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API Error:', errorData);
      throw new Error(errorData.error?.message || 'Gemini API call failed');
    }

    const data = await response.json();
    let result = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Final polish on the result
    result = cleanOutput(result);

    if (result) {
      cacheResult(hashKey(prompt), result);
    }

    return result;
  } catch (error: any) {
    console.error('Gemini Analysis Error:', error);
    throw new Error(error.message || 'Analysis failed');
  }
}

export async function callGemini(prompt: string, imageBase64?: string): Promise<string> {
  if (imageBase64) {
    const mimeType = imageBase64.startsWith('data:application/pdf')
      ? 'application/pdf'
      : imageBase64.startsWith('data:image/png')
        ? 'image/png'
        : imageBase64.startsWith('data:image/webp')
          ? 'image/webp'
          : 'image/jpeg';

    const base64 = imageBase64.split(',')[1] || imageBase64;
    return callGeminiDirectly(prompt, [{ base64, mimeType }]);
  }
  return callGeminiDirectly(prompt);
}

export async function callGeminiMultiPart(prompt: string, files: FilePart[]): Promise<string> {
  return callGeminiDirectly(prompt, files);
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function getFileMimeType(file: File): string {
  if (file.type === 'application/pdf') return 'application/pdf';
  if (file.type.startsWith('image/png')) return 'image/png';
  if (file.type.startsWith('image/webp')) return 'image/webp';
  return 'image/jpeg';
}

// ── Extraction prompts ──

export function buildExtractTextFromImagePrompt(context: string): string {
  return `Extract ALL handwritten or printed text from this image exactly as written. This is a ${context}. Output the extracted text only, no commentary. NO asterisks or markdown formatting.`;
}

export function buildExtractWatFromImagePrompt(): string {
  return `This is a handwritten WAT (Word Association Test) response sheet. It has two columns: Word and Sentence.
Extract ALL word-sentence pairs from this image. Output ONLY as a JSON array, no extra text:
[{"word": "...", "sentence": "..."}, ...]
Be precise — extract exactly what is written. NO asterisks or markdown formatting.`;
}

export function buildExtractSrtFromImagePrompt(): string {
  return `This is a handwritten SRT (Situation Reaction Test) response sheet. It has two columns: Situation and Response.
Extract ALL situation-response pairs from this image. Output ONLY as a JSON array, no extra text:
[{"situation": "...", "response": "..."}, ...]
Be precise — extract exactly what is written. NO asterisks or markdown formatting.`;
}

// ── Analysis prompts using Centralized Library ──

export function buildPiqPrompt(): string {
  return `You are a senior SSB psychologist analyzing a PIQ (Personal Information Questionnaire).

Analyze this PIQ and extract a concise psychological profile:
1. Key personality traits (5-8)
2. Interests and hobbies
3. Leadership potential indicators
4. Initial 15 OLQ mapping — likely strong and weak OLQs
5. Overall profile summary (3-4 lines)
6. Key themes (3-5 keywords)

The 15 OLQs: Effective Intelligence, Reasoning Ability, Organizing Ability, Power of Expression, Social Adaptability, Cooperation, Sense of Responsibility, Initiative, Self Confidence, Speed of Decision, Ability to Influence the Group, Liveliness, Determination, Courage, Stamina

Output ONLY as JSON:
{
  "traits": [...],
  "interests": [...],
  "leadershipMarkers": [...],
  "olqInitialMapping": { "likelyStrong": [...], "likelyWeak": [...] },
  "overallProfile": "...",
  "keyThemes": [...]
}`;
}

export function buildTatPrompt(storyNumber: number, story: string, hasPicture?: boolean): string {
  return `${SYSTEM_PROMPT_TAT}

CANDIDATE DATA FOR THIS SPECIFIC ANALYSIS:
Story Number: ${storyNumber}
Candidate Story: "${story}"
${hasPicture ? "[Picture context provided via image attachment]" : ""}

Generate the analysis according to the expert instructions above.
${GIBBERISH_GUARD_INSTRUCTION}`;
}

export function buildTatPdfPrompt(): string {
  return `${SYSTEM_PROMPT_TAT}

You are evaluating a batch of TAT stories from a PDF or multi-page image.
For EACH story found, provide analysis, OLQ assessment, and a model improved version.
Finally, provide a Batch Summary of patterns and strongest/weakest OLQs.
${GIBBERISH_GUARD_INSTRUCTION}`;
}

export function buildWatPrompt(responses: { word: string; sentence: string }[]): string {
  const formattedResponses = responses.map((r, i) => `${i + 1}. Word: "${r.word}" -> Sentence: "${r.sentence}"`).join('\n');

  return `${SYSTEM_PROMPT_WAT}

CANDIDATE DATA FOR ANALYSIS:
${formattedResponses}

Analyze the candidate's responses and provide the Batch Summary as instructed.
${GIBBERISH_GUARD_INSTRUCTION}`;
}

export function buildWatPdfPrompt(): string {
  return `${SYSTEM_PROMPT_WAT}

You are evaluating handwritten or typed WAT responses from a PDF.
First extract all 60 word-sentence pairs, then provide analysis and model improvements for each.
Finally, provide the Batch Summary.
${GIBBERISH_GUARD_INSTRUCTION}`;
}

export function buildSrtPrompt(responses: { situationNumber: number; situation: string; response: string }[]): string {
  const formattedData = responses.map(r => `Situation ${r.situationNumber}: "${r.situation}"\nResponse: "${r.response}"`).join('\n\n');

  return `${SYSTEM_PROMPT_SRT}

CANDIDATE DATA FOR ANALYSIS:
${formattedData}

Generate the detailed reactions and OLQ reflections as instructed.
${GIBBERISH_GUARD_INSTRUCTION}`;
}

export function buildSrtPdfPrompt(): string {
  return `${SYSTEM_PROMPT_SRT}

You are evaluating SRT responses from a PDF.
Extract all 60 situation-response pairs, assess each, and provide improved reactions.
Finally, provide the Batch Summary.
${GIBBERISH_GUARD_INSTRUCTION}`;
}

export function buildSdPrompt(paragraphType: string, content: string): string {
  return `You are a senior SSB psychologist evaluating a Self Description paragraph.
Paragraph Type: ${paragraphType}
Content: "${content}"

Follow these rules:
1. HONESTY OVER PERFECTION: Mention 1-2 genuine weaknesses.
2. BE SPECIFIC — NOT VAGUE.
3. CONSISTENCY ACROSS PARAGRAPHS.
4. GROWTH MINDSET.

Provide:
1. Authenticity Check.
2. OLQ Mapping.
3. Rewritten Paragraph (Ideal/Honest version, 80-120 words).
4. Score: X/10.
${GIBBERISH_GUARD_INSTRUCTION}`;
}

export function buildSdFromPdfPrompt(): string {
  return `You are an SSB psychologist evaluating a full 5-paragraph Self Description PDF.
Analyze each paragraph for authenticity, OLQ coverage, and provide rewritten versions.
Consistency Check across all 5 sections is mandatory.
${GIBBERISH_GUARD_INSTRUCTION}`;
}

export function buildFullReportPrompt(
  piqContext: Record<string, unknown> | null,
  tatSummary: string | null,
  watSummary: string | null,
  srtSummary: string | null,
  sdSummary: string | null
): string {
  return `You are a board-level SSB psychologist generating a COMPOSITE psychological assessment.
  
Mansa-Vacha-Karma Alignment Evaluation:
PIQ Profile: ${JSON.stringify(piqContext || 'Not available')}
TAT Analysis: ${tatSummary || 'Not available'}
WAT Analysis: ${watSummary || 'Not available'}
SRT Analysis: ${srtSummary || 'Not available'}
SD Analysis: ${sdSummary || 'Not available'}

Generate a professional synthesis including:
1. Overall Identity Match Score (Alignment between claims and evidence).
2. Mansa-Vacha-Karma Matrix (Discrepancy detection).
3. Stress Index & Coaching Detection.
4. 15 OLQ Strict Assessment Matrix.
5. Final SSB Readiness Verdict.
6. IO Risk Areas (Interview probe questions).
7. 30-Day Targeted Action Plan.

Output strictly plain text report format.`;
}

export function buildInterviewModeAPrompt(question: string, answer: string): string {
  return `You are an SSB Interview Coach AI.
Candidate's Question: "${question}"
Candidate's Answer: "${answer}"

Provide feedback:
1. STRENGTHS
2. FIXES
3. MODEL ANSWER (Ideal crisp SSB response, max 10-12 lines)
4. SCORE: X/10`;
}

export function buildInterviewModeBPrompt(statement: string): string {
  return `You are an SSB Interview Officer (IO).
Candidate's Claim: "${statement}"

Generate 8-9 logical follow-up probe questions and model responses that an IO would ask to verify this claim. Focus on consistency and micro-details.`;
}

export function buildInterviewModeCPrompt(transcript: string): string {
  return `Analyze this SSB Interview mock transcript for consistency, OLQ signals, and red flags.
Transcript:
${transcript}

Provide: Overall Impression, Consistency Check, Top 3 Strengths, Top 3 Areas to Improve, Final Readiness Score (X/10).`;
}

export function buildVerifyDocumentPrompt(type: 'PIQ' | 'TAT' | 'WAT' | 'SRT' | 'SD'): string {
  const common = "\n\nYou are a document verification AI. Responde ONLY with 'VALID: [Short confirmation]' or 'REJECTED: [Specific reason]'. DO NOT provide analysis.";

  switch (type) {
    case 'PIQ':
      return `Target: Official PIQ (107-A or Target SSB format).${common}`;
    case 'SRT':
      return `Target: Handwritten/Printed SRT response sheet (exactly 60 items).${common}`;
    case 'WAT':
      return `Target: Handwritten/Printed WAT response sheet (exactly 60 items).${common}`;
    case 'TAT':
      return `Target: SSB TAT sketch image or response sheet.${common}`;
    case 'SD':
      return `Target: Self Description response sheet (5 standard paragraphs).${common}`;
    default:
      return `Verify if this document is relevant to SSB psych testing.${common}`;
  }
}
