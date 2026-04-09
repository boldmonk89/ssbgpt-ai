import { supabase } from "@/integrations/supabase/client";

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
  try { localStorage.setItem(key, JSON.stringify({ result, ts: Date.now() })); } catch {}
}

function getCachedResult(key: string): string | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw).result || null;
  } catch { return null; }
}

async function callEdgeFunction(prompt: string, files?: FilePart[]): Promise<string> {
  if (!navigator.onLine) {
    const cached = getCachedResult(hashKey(prompt));
    if (cached) return cached + '\n\n---\n*⚠️ Showing cached result (offline)*';
    throw new Error('You are offline. AI analysis requires an internet connection.');
  }

  const cleanFiles = files?.map(f => ({
    base64: f.base64.replace(/^data:[^;]+;base64,/, ''),
    mimeType: f.mimeType,
  }));

  const { data, error } = await supabase.functions.invoke('analyze', {
    body: { prompt, files: cleanFiles || [] },
  });

  if (error) throw new Error(error.message || 'Analysis failed');
  if (data?.error) throw new Error(data.error);
  const result = data?.result || '';
  cacheResult(hashKey(prompt), result);
  return result;
}

export async function callGemini(prompt: string, imageBase64?: string): Promise<string> {
  if (imageBase64) {
    const mimeType = imageBase64.startsWith('data:application/pdf')
      ? 'application/pdf'
      : imageBase64.startsWith('data:image/png')
      ? 'image/png'
      : 'image/jpeg';
    return callEdgeFunction(prompt, [{ base64: imageBase64, mimeType }]);
  }
  return callEdgeFunction(prompt);
}

export async function callGeminiMultiPart(prompt: string, files: FilePart[]): Promise<string> {
  return callEdgeFunction(prompt, files);
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
  return `Extract ALL handwritten or printed text from this image exactly as written. This is a ${context}. Output the extracted text only, no commentary.`;
}

export function buildExtractWatFromImagePrompt(): string {
  return `This is a handwritten WAT (Word Association Test) response sheet. It has two columns: Word and Sentence.
Extract ALL word-sentence pairs from this image. Output ONLY as a JSON array, no extra text:
[{"word": "...", "sentence": "..."}, ...]
Be precise — extract exactly what is written.`;
}

export function buildExtractSrtFromImagePrompt(): string {
  return `This is a handwritten SRT (Situation Reaction Test) response sheet. It has two columns: Situation and Reaction/Response.
Extract ALL situation-response pairs from this image. Output ONLY as a JSON array, no extra text:
[{"situation": "...", "response": "..."}, ...]
Be precise — extract exactly what is written.`;
}

// ── Analysis prompts (NO PIQ context in individual tests) ──

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
  return `You are an SSB psychologist evaluating a TAT story.

Story Number: ${storyNumber}
${hasPicture ? 'TAT picture is attached.' : ''}
Story: "${story}"

Give a CONCISE analysis covering:

**A. Story Structure** — Does it have Past → Present → Future? Is there a clear hero with name/age/role?

**B. Theme & Stimulus Match** — Is the theme positive? Does it match the picture? Any negativity flags?

**C. OLQ Signals** — Which of the 15 OLQs are demonstrated? (Effective Intelligence, Reasoning Ability, Organizing Ability, Power of Expression, Social Adaptability, Cooperation, Sense of Responsibility, Initiative, Self Confidence, Speed of Decision, Ability to Influence the Group, Liveliness, Determination, Courage, Stamina)

**D. Key Improvements** — List 3-5 specific weak points with suggested fixes.

**E. Score** — Rate out of 10 with brief justification.

**F. Rewritten Story** — Improved version keeping the same essence.

Keep the analysis focused and actionable. No unnecessary repetition.`;
}

export function buildTatPdfPrompt(): string {
  return `You are an SSB psychologist. This PDF contains multiple TAT stories written by a candidate.

For EACH story found, provide:

**Story [N] Analysis:**
- **Structure**: Past/Present/Future check, hero details
- **Theme Quality**: Positive/negative, realistic resolution
- **OLQ Signals**: Which of the 15 OLQs are shown
- **Key Improvements**: 3-5 specific fixes
- **Score**: Out of 10
- **Rewritten Version**: Improved story

After all stories, give a **Batch Summary**: overall TAT patterns, strongest OLQs across stories, weakest OLQs, top 3 priority improvements.

Keep each story analysis concise and actionable.`;
}

export function buildWatPrompt(responses: { word: string; sentence: string }[]): string {
  return `You are an SSB psychologist evaluating WAT responses.

WAT Responses: ${JSON.stringify(responses)}

For each response, check:
1. Word count (max 6 words)
2. Third-person/observational quality (no personal pronouns)
3. Positivity (negative words must be reframed positively)
4. OLQ signal

Then provide a **Summary Table** showing: Word | Original | Pass/Fail | Issues | Corrected Sentence | OLQs Signaled

Followed by **Batch Summary**:
- OLQ Coverage: which OLQs are well-covered, which are missing
- Top 5 improvements needed
- Overall WAT Rating (Excellent/Good/Average/Below Average)

Keep analysis concise. Focus on actionable corrections.`;
}

export function buildWatPdfPrompt(): string {
  return `You are an SSB psychologist. This PDF/image contains handwritten WAT (Word Association Test) responses.

First extract all word-sentence pairs. Then for each:
1. Check word count (max 6), pronouns, positivity, observational quality
2. Identify OLQ signals

Provide a summary table and batch analysis with OLQ coverage map, top improvements, and overall rating. Keep it concise and actionable.`;
}

export function buildSrtPrompt(responses: { situationNumber: number; situation: string; response: string }[]): string {
  return `You are an SSB psychologist evaluating SRT responses.

SRT Responses: ${JSON.stringify(responses)}

For each situation-response:
1. **Category**: Emergency/Leadership/Ethical/Social/Professional
2. **Evaluation**: Realism check, officer qualities shown
3. **OLQ Signals**: Which of the 15 OLQs demonstrated
4. **Improvement**: Better response if needed
5. **Score**: Out of 10

Then **Batch Summary**:
- OLQ patterns across all responses
- Consistent weaknesses
- Top 5 improvements
- Overall SRT Rating

Keep concise and actionable. No repetitive preamble.`;
}

export function buildSrtPdfPrompt(): string {
  return `You are an SSB psychologist. This PDF/image contains SRT (Situation Reaction Test) responses.

First extract all situation-response pairs. Then for each:
1. Category, realism check, OLQ signals, score out of 10
2. Improved response if needed

Provide batch summary with OLQ patterns, weaknesses, top improvements, overall rating. Keep concise.`;
}

export function buildSdPrompt(paragraphType: string, content: string): string {
  return `You are an SSB psychologist evaluating a Self Description paragraph.

Paragraph Type: ${paragraphType}
Content: "${content}"

Analyze concisely:

**A. Authenticity** — Genuine or templated? Are specific examples cited?

**B. OLQ Coverage** — Which of the 15 OLQs are evidenced? Which are missing?

**C. Key Improvements** — Weak/vague lines with specific replacements.

**D. Score** — Out of 10 with justification.

**E. Rewritten Paragraph** — Improved version with better OLQ coverage and authenticity.

Keep focused and actionable.`;
}

export function buildSdFromPdfPrompt(): string {
  return `You are an SSB psychologist. This PDF contains a candidate's Self Description with 5 paragraphs:
1. What Parents think
2. What Teachers think
3. What Friends think
4. What YOU think of yourself
5. Qualities you wish to develop

For EACH paragraph:
- Authenticity analysis
- OLQ coverage
- Key improvements with replacements
- Score out of 10
- Rewritten paragraph

Then overall SD summary with consistency patterns and top improvements. Keep concise.`;
}

export function buildFullReportPrompt(
  piqContext: any,
  tatSummary: string,
  watSummary: string,
  srtSummary: string,
  sdSummary: string
): string {
  return `You are a board-level SSB psychologist. Generate a comprehensive assessment based on ALL test data.

PIQ Profile: ${JSON.stringify(piqContext || 'Not available')}
TAT Analysis: ${tatSummary || 'Not available'}
WAT Analysis: ${watSummary || 'Not available'}
SRT Analysis: ${srtSummary || 'Not available'}
SD Analysis: ${sdSummary || 'Not available'}

Generate:

## 1. Executive Summary
Overall psychological profile in 5-6 lines.

## 2. Cross-Test Consistency (Mansa-Vacha-Karma)
Compare personality across PIQ, TAT, WAT, SRT, SD. Highlight:
- Where personality is CONSISTENT across tests → "Your psychological profile shows strong alignment in..."
- Where there are CONTRADICTIONS → specific flags

## 3. 15 OLQ Assessment
For each OLQ: rating 1-10 with evidence from multiple tests.

## 4. Factor-wise Summary
Mind / Heart / Guts / Limbs — overall strength per factor.

## 5. Strengths
Top 5 OLQ strengths with evidence.

## 6. Priority Improvements
Top 5 specific, actionable improvements ranked by impact.

## 7. SSB Readiness
Recommended / Needs Work / Not Ready — with clear rationale.

Format with clear headings. Be direct, constructive, and honest.`;
}

export function buildFullPdfAnalysisPrompt(): string {
  return `You are a board-level SSB psychologist. This PDF contains a candidate's COMPLETE psychological test responses including some or all of: PIQ, TAT stories, WAT responses, SRT responses, and SD paragraphs.

Each section should be clearly labeled with headings in the document.

Analyze EVERYTHING found and generate:

## 1. Section-wise Analysis
For each test found (TAT/WAT/SRT/SD), provide concise analysis with scores and improvements.

## 2. Cross-Test Consistency
Where personality is consistent across tests and where contradictions exist.

## 3. 15 OLQ Assessment
Rate each OLQ 1-10 with evidence from across all tests.

## 4. Top Strengths & Improvements
5 strongest OLQs and 5 priority improvements.

## 5. SSB Readiness
Recommended / Needs Work / Not Ready with rationale.

Keep analysis structured and actionable. Focus on what matters for selection.`;
}
