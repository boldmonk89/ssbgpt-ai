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
  return `You are an SSB (Services Selection Board) Psychology Test assistant specializing in TAT (Thematic Apperception Test) analysis.

${hasPicture ? `STEP 1 — IMAGE VALIDATION (Run this FIRST before any analysis):
Examine the uploaded image and classify it.
REJECT if the image is:
- A photo of a phone/tablet/laptop screen (screen glare, bezels, status bar visible)
- A photograph of real people or real scenes
- A colorful/RGB image (not a sketch)
- A blurry screenshot
- Any image that is NOT a hand-drawn or printed black-and-white pencil/charcoal sketch in SSB TAT style

If REJECTED, respond ONLY with:
"⚠️ Invalid Image Detected!
Please upload a proper TAT image.
A valid TAT image should be:
✅ A black & white pencil/charcoal sketch
✅ Showing human figures in ambiguous situations
✅ Clear and directly photographed (not a screen capture)
✅ Similar to official SSB TAT test cards

You are only wasting your time by uploading irrelevant images.
Please upload a relevant SSB TAT picture for analysis."

STEP 2 — VALID IMAGE ANALYSIS (Only if image passes validation):
If the image IS a valid SSB TAT-style sketch, perform full analysis:` : ''}

You are analyzing this image/story for SSB TAT preparation. Story Number: ${storyNumber}.
Story: "${story}"

CRITICAL: Before analyzing, check if the story is gibberish or random input. If so, DO NOT analyze and respond with a witty, sarcastic warning about submitting this at actual SSB.

If valid, provide a structured analysis:

1. 📸 SCENE DESCRIPTION (If image was provided)
   - What is happening in the image?
   - Who are the characters? (age, relationship, setting)
   - What is the mood/atmosphere?

2. 📝 IDEAL STORY STRUCTURE (vs Candidate's Story)
   Review the candidate's story structure (Past, Present, Future). Then draft an improved Model Story keeping their essence but optimized for SSB.

3. 💡 THEMES & OLQ SIGNALS
   - Which of the 15 OLQs are demonstrated by the candidate?
   - Leadership, problem-solving, courage, empathy, etc.

4. ⚠️ COMMON MISTAKES TO AVOID
   - What negative themes candidates often wrongly write for this image or stimulus.

5. ⭐ OLQ SCORE POTENTIAL & RATING
   - Rate the candidate's story (out of 10)
   - Which specific OLQs need improvement?

Always respond in a structured, helpful, encouraging tone suitable for SSB aspirants. No unnecessary repetition.`;
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

CRITICAL — GIBBERISH & IRRELEVANT INPUT DETECTION:
Before analyzing, check if any sentences are random keyboard mashing, gibberish, completely irrelevant, or trolling. If the majority of responses are gibberish/irrelevant, DO NOT analyze — respond with a witty sarcastic 3-4 line message about what the SSB psychologist would think, and ask for real responses. If only a few are gibberish, flag those specifically with sarcasm and analyze the rest.

WAT Responses: ${JSON.stringify(responses)}

For each response, check:
1. Word count (max 6 words)
2. Third-person/observational quality (no personal pronouns)
3. Positivity (negative words must be reframed positively)
4. OLQ signal

Then provide a **Summary List** (DO NOT output markdown tables). Ensure everything is in clean plain text with bolded headers:
**Word:** [word]
**Original Response:** [sentence]
**Pass/Fail:** [pass/fail]
**Issues:** [issues found]
**Corrected Sentence:** [re-written sentence]
**OLQs Signaled:** [list OLQs]

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

CRITICAL — GIBBERISH & IRRELEVANT INPUT DETECTION:
Before analyzing, check if responses are random keyboard mashing, gibberish, irrelevant, or trolling. If so, DO NOT analyze — respond with a witty sarcastic 3-4 line message about what would happen at actual SSB, and ask for real responses.

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

Always output in a clear list format. DO NOT utilize markdown tables under any circumstances. Keep concise and actionable. No repetitive preamble.`;
}

export function buildSrtPdfPrompt(): string {
  return `You are an SSB psychologist. This PDF/image contains SRT (Situation Reaction Test) responses.

First extract all situation-response pairs. Then for each:
1. Category, realism check, OLQ signals, score out of 10
2. Improved response if needed

Provide batch summary with OLQ patterns, weaknesses, top improvements, overall rating. Keep concise.`;
}

export function buildSdPrompt(paragraphType: string, content: string): string {
  return `You are a senior SSB psychologist evaluating a Self Description paragraph with deep expertise in officer-level personality assessment.

CRITICAL — GIBBERISH & IRRELEVANT INPUT DETECTION:
Before analyzing, check if the content is gibberish, random text, or completely irrelevant to self-description. If so, respond with a witty sarcastic 3-4 line message and ask for a real paragraph.

Paragraph Type: ${paragraphType}
Content: "${content}"

Provide a THOROUGH analysis:

**A. Authenticity Check (Deep Dive)**
- Is this genuine or template/coaching-copied?
- Are there SPECIFIC examples, incidents, or details that prove it's real?
- Does the language match a genuine self-reflection or does it read like a textbook?
- Flag any contradictions within the paragraph

**B. OLQ Evidence Map**
For EACH of the 15 OLQs, mark: ✅ Evidenced (with quote) | ⚠️ Weak/Vague | ❌ Missing
The 15 OLQs: Effective Intelligence, Reasoning Ability, Organizing Ability, Power of Expression, Social Adaptability, Cooperation, Sense of Responsibility, Initiative, Self Confidence, Speed of Decision, Ability to Influence the Group, Liveliness, Determination, Courage, Stamina

**C. Line-by-Line Improvement**
For each weak or vague line, provide:
- Original line (quoted)
- What's wrong with it
- Specific replacement line with concrete example/incident

**D. Consistency with SD Context**
- Does this paragraph align with what ${paragraphType.includes('Parents') ? 'parents' : paragraphType.includes('Teachers') ? 'teachers' : paragraphType.includes('Friends') ? 'friends' : 'the candidate'} would realistically say?
- Are the qualities mentioned appropriate for this perspective?

**E. Score** — Out of 10 with detailed justification (not just a number — explain WHY)

**F. Rewritten Paragraph**
- Complete rewritten version that:
  - Keeps the same person's voice and perspective
  - Adds specific incidents/examples
  - Naturally covers 5-6 OLQs through actions, not adjectives
  - Sounds authentic, not rehearsed
  - 80-120 words

**G. Quick Tips**
- 3 actionable tips to make THIS specific paragraph stand out at SSB

Be direct, constructive, and specific. No generic advice.`;
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
  return `You are a board-level SSB psychologist generating the MOST CRITICAL assessment — matching a candidate's PIQ (Personal Information Questionnaire) profile against their actual psychological test performance.
  
This is the "Mansa-Vacha-Karma" alignment check — does what the candidate CLAIMS (PIQ) match what their SUBCONSCIOUS reveals (TAT, WAT, SRT, SD)?

PIQ Profile: ${JSON.stringify(piqContext || 'Not available')}
TAT Analysis: ${tatSummary || 'Not available'}
WAT Analysis: ${watSummary || 'Not available'}
SRT Analysis: ${srtSummary || 'Not available'}
SD Analysis: ${sdSummary || 'Not available'}

Generate a DEEP clinical report:

## 1. Executive Summary & Identity Match Score
Overall psychological profile in 5-6 lines. Give an overall alignment percentage (0-100%) between PIQ claims and test evidence.

## 2. Mansa-Vacha-Karma (Cross-Match)
Compare personality across all tests. Highlight:
- **Consistency Zones (Green Flags)**: Where PIQ and tests perfectly align — these are the candidate's GENUINE strengths.
- **Contradiction Zones (Red Flags)**: Where PIQ claims directly contradict test evidence. Specific examples with quotes.
- **Overclaimed Qualities**: Qualities emphasized in PIQ but NOT evidenced in tests.

## 4. Stress Index & Emotional Markers
- **Anxiety/Pressure Detection**: Detect signs of forced positive thinking or over-preparation.
- **Stress-Reaction Patterns**: How the candidate handles time-sensitive transitions.

## 5. 15 OLQ Assessment Matrix (with Drill-Down Evidence)
For EACH of the 15 OLQs, rate 1-10 based on COMBINED evidence. 
- **Evidence Snippets**: Provide direct quotes or specific story themes that triggered this rating.

## 6. SSB Readiness & Potential
- **Readiness Level**: RECOMMENDED MATERIAL / NEEDS FOCUSED WORK / SIGNIFICANT GAPS
- **Strongest Asset**: The ONE quality that will carry the candidate
- **Biggest Risk**: The ONE thing that could sink them

## 7. Interviewing Officer (IO) Risk Areas
Top 5 questions the IO will DEFINITELY ask based on PIQ-Test contradictions. For each:
- The question
- Why they'll ask it (the specific contradiction)
- How to answer it honestly

## 8. 30-Day Action Plan
Ranked list of 5 specific things to do to close the gap between claims and actual personality.

Be brutally honest, constructive, and direct. The candidate needs TRUTH, not comfort.`;
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

export function buildPiqPsychMatchPrompt(
  piqContext: any,
  tatSummary: string,
  watSummary: string,
  srtSummary: string,
  sdSummary: string
): string {
  return `You are a board-level SSB psychologist performing the MOST CRITICAL assessment — matching a candidate's PIQ (Personal Information Questionnaire) profile against their actual psychological test performance.

This is the "Mansa-Vacha-Karma" alignment check — does what the candidate CLAIMS about themselves (PIQ) match what their SUBCONSCIOUS reveals (TAT, WAT, SRT, SD)?

PIQ Profile: ${JSON.stringify(piqContext || 'Not available')}
TAT Analysis: ${tatSummary || 'Not available'}
WAT Analysis: ${watSummary || 'Not available'}
SRT Analysis: ${srtSummary || 'Not available'}
SD Analysis: ${sdSummary || 'Not available'}

Generate a DEEP cross-match assessment without explicitly numbering "Step 1", "Step 2" or using heading indexes:

## PIQ vs Psych Test — Alignment Report

### Identity Match Score
Give an overall alignment percentage (0-100%) between PIQ claims and psych test evidence. Show your calculation.

### What PIQ Claims vs What Tests Reveal
For each major personality trait/quality claimed in PIQ, use a clear text/bullet format (DO NOT USE TABLES):
**Claim:** ...
**Test Evidence:** ...
**Match Status:** ...
**Details:** ...

### Hidden Personality Traits
Qualities that showed up STRONGLY in tests but were NOT mentioned in PIQ — these reveal subconscious strengths the candidate may not be aware of.

### Overclaimed Qualities
Qualities emphasized in PIQ but NOT evidenced in tests — these are potential exaggeration flags that the interviewing officer WILL probe.

### Consistency Zones (Green Flags)
Where PIQ and tests perfectly align — these are the candidate's GENUINE strengths. The SSB board will trust these.

### Contradiction Zones (Red Flags)
Where PIQ claims directly contradict test evidence. These WILL be caught by the psychologist and IO. Specific examples with quotes.

### 15 OLQ Potential Rating
For each OLQ, rate 1-10 based on COMBINED PIQ + test evidence:
- Show PIQ indication vs Test evidence
- Final combined score with confidence level (High/Medium/Low)

### SSB Potential Meter
Based on everything:
- **Overall Potential**: Give a percentage (0-100%)
- **Readiness Level**: RECOMMENDED MATERIAL / NEEDS FOCUSED WORK / SIGNIFICANT GAPS
- **Strongest Asset**: The ONE quality that will carry the candidate
- **Biggest Risk**: The ONE thing that could sink them
- **Timeline**: Realistic estimate of preparation time needed

### Interviewing Officer (IO) Risk Areas
Top 5 questions the IO will DEFINITELY ask based on PIQ-Test contradictions. For each:
- The question
- Why they'll ask it (what contradiction triggered it)
- How to answer it honestly

### Action Plan
Ranked list of 5 specific things to do in the next 30 days to close the gap between PIQ claims and actual personality.

Be brutally honest but constructive. The candidate needs TRUTH, not comfort.`;
}

// ── Interview Practice Prompts ──

export function buildInterviewModeAPrompt(question: string, answer: string): string {
  return `You are an SSB Interview Coach AI.
  
Candidate's Question: "${question}"
Candidate's Answer: "${answer}"

Provide feedback:
1. ✅ WHAT YOU DID WELL: Specific strengths in their answer.
2. 🔧 IMPROVEMENTS NEEDED: What was missing, weak, or could be stronger. Specific language/content suggestions.
3. 📝 IMPROVED ANSWER (Model Version): Rewrite their answer in an ideal SSB PI format. Keep it natural, not over-polished.
4. 💯 SCORE: Give a score out of 10 with a brief reason.

Be encouraging, structured, and exam-focused.`;
}

export function buildInterviewModeBPrompt(statement: string): string {
  return `You are an SSB Interview Coach AI acting like an Interviewing Officer (IO).
  
Candidate's Statement: "${statement}"

Analyze this claim and generate 8-9 logical follow-up/counter questions that an IO would use to trap or probe the candidate. 

For EACH question, you MUST also provide a "Potential High-Impact Answer" that demonstrates honesty and OLQs.

Format your response exactly as:
**IO Counter-Questions & Model Answers:**

1. **IO Question:** [The specific probe]
   **Model Answer:** [What a recommended candidate would say]

2. **IO Question:** ...
   **Model Answer:** ...

...

**Psychologist's Tip:** Prepare your own versions of these story-based answers. Don't memorize, internalize the logic.

Be direct and exam-focused.`;
}

export function buildInterviewModeCPrompt(transcript: string): string {
  return `You are an SSB Interview Coach AI evaluating a full mock interview transcript.
  
Transcript:
${transcript}

Analyze ALL answers together and give:
- **Overall Impression**: Summary of the candidate's performance.
- **Consistency Check**: Do answers contradict each other? Point out red flags.
- **Top 3 Strengths**: What qualities shone through.
- **Top 3 Areas to Improve**: Where they need urgent work before the actual SSB.
- **Final Readiness Score**: X/10 with brief justification.

Be encouraging, structured, and exam-focused.`;
}
