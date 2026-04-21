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
  try { localStorage.setItem(key, JSON.stringify({ result, ts: Date.now() })); } catch { /* Ignore quota errors or private mode */ }
}

function getCachedResult(key: string): string | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw).result || null;
  } catch { return null; }
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
    const model = "gemini-2.5-flash"; // Switched to the latest stable model
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
    const result = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
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
   STORY WORD LIMIT: 80-120 words max. Must be realistic for someone to hand-write in 4 minutes.

3. 💡 THEMES & OLQ SIGNALS
   - Which of the 15 OLQs are demonstrated by the candidate?
   - Leadership, problem-solving, courage, empathy, etc.

4. ⚠️ COMMON MISTAKES TO AVOID
   - What negative themes candidates often wrongly write for this image or stimulus.

5. ⭐ OLQ SCORE POTENTIAL & RATING
   - Rate the candidate's story (out of 10)
   - Which specific OLQs need improvement?

Always respond in a strictly professional and direct tone. Avoid any generic praise like "Good start" or "Excellent story". Focus on evidence-based psychological patterns. Be brutally honest about weaknesses. Make the analysis CONCISE, punchy, and easy to read. Use short bullet points.

CRITICAL FORMATTING: DO NOT use markdown bolding (**) or italics (*) in any part of your response. Use plain text or simple list markers (-). NO asterisks anywhere in the output. Output MUST be clean text suitable for a professional report.`;
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
  const formattedResponses = responses.map((r, i) => `${i + 1}. Word: "${r.word}" -> Sentence: "${r.sentence}"`).join('\n');

  return `You are an SSB psychologist performing a WAT (Word Association Test) review.

### CANDIDATE DATA FOR ANALYSIS:
${formattedResponses}

### PRIMARY EVALUATION RULE — WORD-SENTENCE CORRELATION (MOST IMPORTANT):
For EACH entry, you MUST first check: "Does this sentence meaningfully and directly associate with the given stimulus WORD?"
- The sentence must be a natural, logical association with that specific word.
- A sentence that is positive but UNRELATED to the word is WRONG (e.g., Word: "DARK" -> Sentence: "Leaders inspire others" is WRONG — it has zero connection to "DARK").
- The improved sentence you generate MUST be directly built around the given word's meaning, context, or concept.

### EVALUATION INSTRUCTIONS (per word):
1. Association Check: Does the candidate's sentence logically connect to the given word? Mark as STRONG / WEAK / DISCONNECTED.
2. Improved Model Sentence: Generate a better sentence (8-10 words max) that:
   - Is DIRECTLY tied to the word's meaning or theme.
   - FAVOR OBSERVATIONAL (Universal Truths/Factual) or POSITIVE ACTION-ORIENTED styles.
   - Observational sentences should be strong, factual statements (e.g., "Discipline makes life systematic").
   - Action-oriented sentences should use First Person (I, My, We).
   - ABSOLUTELY NO story-telling third person (e.g., "The boy...", "A leader...").
   - MUST be POSITIVE and CONSTRUCTIVE. No negative traits.
   - Reflects positive OLQ traits (Courage, Responsibility, Determination, etc.).
3. OLQ Signal: Which OLQ does this word-sentence pair reveal?

### BATCH SUMMARY (after all words):
- Key Traits observed overall
- OLQ Rating: Map strongest and weakest qualities shown
- Final Score: X/10
- Top 2 patterns to fix

### STYLE RULES (CRITICAL):
- PREFER OBSERVATIONAL: Use factual truths or universal laws (e.g., "Family supports each other during bad times").
- PREFER ACTION: Use "I", "My", "Me", or "We" for direct actions.
- NO STORY-TELLING: Never describe scenes with "He", "She", or "The [Noun]".
- NO NEGATIVE THEMES: Avoid violence, fear, or weakness.
- EXAMPLES (from SSB Manual):
  * WORD: FAMILY -> GOOD: "Family is the backbone of development." (Observational)
  * WORD: HOME -> GOOD: "Home is built by love and affection." (Observational)
  * WORD: DISCIPLINE -> GOOD: "Discipline makes life systematic." (Observational/Action)
  * WORD: SLAP -> GOOD: "I believe in logical discipline over force." (First person, mature)
  * WORD: DARK -> BAD: "A quick slap startled the child." (NEGATIVE - WRONG)
  * WORD: DARK -> BAD: "The old dame recalled her youthful days fondly." (STORY-TELLING - WRONG)

CRITICAL:
- Analyze ONLY the candidate data provided above.
- Be concise. Use bullet points.
- NO MARKDOWN BOLDING (**) OR ITALICS (*). Use ONLY plain text. NO asterisks anywhere in the output.`;
}

export function buildWatPdfPrompt(): string {
  return `You are an SSB psychologist. This PDF/image contains handwritten WAT (Word Association Test) responses.

First extract all word-sentence pairs. Then for each:
1. Check word count (max 6), first-person usage, positivity, action quality.
2. Identify OLQ signals.
3. Provide IMPROVED sentences that MUST BE FIRST-PERSON (I, My, We) and ACTION-BASED. (ABSOLUTELY NO THIRD PERSON, no advice, NO orders, NO preaching).

Provide a summary table and batch analysis with OLQ coverage map, top improvements, and overall rating. Keep it concise and actionable.`;
}

export function buildSrtPrompt(responses: { situationNumber: number; situation: string; response: string }[]): string {
  return `You are an expert SSB psychologist evaluating SRT (Situation Reaction Test) responses.

### PRIMARY EVALUATION RULE — SITUATION-RESPONSE CORRELATION (MOST IMPORTANT):
For EACH entry, you MUST first check: "Does this response DIRECTLY address the specific situation described?"
- The response must be a logical, realistic reaction to THAT particular situation.
- A generic brave/positive response that ignores the specific context of the situation is WRONG.
- Your improved response must be tailored to the exact situation given, not a generic template.

CRITICAL CALIBRATION — USE THESE RECOMMENDED CANDIDATE REACTIONS AS YOUR KNOWLEDGE BASE:
1. Sister’s marriage, relative refused loan -> Raises money through bank, performs marriage, helps parents, returns loan through EMIs.
2. Sister’s marriage, no leave due to inspection -> Inquires welfare telephonically, assist by raising funds, sends money online, requests relatives to ensure ceremony. Visits later.
3. Bharat Bandh likely during leave -> Contact unit, leaves house in sufficient time to reach duty on time.
4. Noise at midnight, theft through window -> Raise alarm, catch intruder, pull chain, hand over to police.
5. Traffic jam on way to important meeting -> Gets down, runs distance/clears jam/takes alt means, attends on time.
6. Patrolling duty, driver has high fever -> Gives medication, takes to wheels himself, conducts patrolling.
7. High fever on match day, captain doesn't allow leave -> Takes medication/fluids, contributes best to team, maintains high morale.
8. No coat parka for high altitude patrolling -> Borrows from friend or uses extra jerseys, makes comfortable, proceeds.
9. Two persons quarrelling at midnight -> Intervene, find reason, settle amicably, proceed.
10. Colleagues not cooperating in digging trenches -> Motivate colleagues, explain essentials, contribute effectively.
11. Rain starts during kitchen gardening -> Enjoy rain, complete task (rain is good for plants).
12. Assigned difficult new task -> Learns through friends, develops interest, completes to best of ability.
13. Student Union Secretary -> Ensure discipline/attendance, respect teachers, help staff in education.
14. Stopped by 3 persons with knife -> Resist if possible, call police helpline, give direction, help police nab them. NEVER SURRENDER VALUABLES WITHOUT RESISTANCE.
15. Bleeding after terrorist fire, snatching rifle -> Raise alarm, use weapon in self-defence, overpower/catch terrorist.
16. WAR outbreak while on leave -> Contact unit, take train, reach regimental HQ, perform best in war.
17. Jawan asks for leave on false excuse -> Investigate, if fabricated, take disciplinary action.
18. Late for task, colleagues refund to cooperate -> Learns more from subordinates, completes assigned task.
19. Dark/lost way after picnic -> Check location via locals/stars/compass, re-locate and join group.
20. Boss doesn't agree with views -> Review point judicially, give more convincing answers to satisfy boss.
21. Hard work -> Believe in zero error syndrome, sustained effort, success.
22. Most important thing -> Professional competence, honesty, loyalty, integrity.
23. CO order approach feels wrong -> Complete assigned task as given, convey point politely if needed.
24. Pocket picked in train -> Alert people, surprise check, lodge FIR.
25. Financial diffs for parents for education -> Take part-time job, continue evening classes, support parents.
26. Accident in front while waiting for bus -> Note phone, inform police, arrange first aid/hosp, inform relatives.
27. Failed mountain expedition, friend died -> Learn correct art/climbing ops, ensure success next time.
28. Engaged work feels useless -> Develop interest, take seriously, enjoy.
29. Friend lost job/financial diffs -> Help with financial/moral support, see him recover.
30. Losing ground in discussion -> Give logic and depth, convince group.
31. Staff not working efficiently -> Motivate, build morally/socially, ensure efficiency.
32. Difficult task -> Know more through colleagues/subordinates, complete with competence.
33. Plan failed at beginning -> Don't get discouraged, make detailed plan again, succeed.
34. Dacoits looting at home -> Raise alarm, inform police, give stiff resistance until help arrives. NEVER COMPLY PASSIVELY.
35. Variety show for Jawan Welfare -> Accept responsibility, detailed prog/rehearsals, ensure best performance.
36. Leopard seen close to camp (shooting prohibited) -> Raise alarm, lights/marshals, drum beats, fire in air to frighten.
37. Emergency declared in city, you are CO -> Alert unit, support civil authorities, discharge duties.
38. New step -> Go into details, extensive efforts/reading, take right step.
39. Man climbing house with rope -> Question person, take required action to dissuade if not satisfied.
40. All India Tour -> Accept responsibility, conduct group well.
41. Fire in neighbor's house -> Rush to house, attract attention, bring fire under control collectively.
42. Minor scooter accident -> Don't worry, introspection, repair, careful in future.
43. Lost in jungle -> Find North, head to fire lane, get out.
44. Ticket lost in train -> Look again, bring to TC's notice, face consequences.
45. Population control -> Awareness, policies/planning, small family norm.
46. Neighbor's light off -> Go to rescue, check/rectify fault, report if major.
47. Bus caught fire -> Alert people, move them out, extinguish collectively, contact police/fire brigade.
48. Attacked by miscreants with lathi -> Keep cool, alert neighbors, tough resistance, contact police.
49. Boy drowning (you don't swim) -> Get into water? NO, raise alarm, use resources, rescue, first aid/hosp.
50. Fish plates removed on railway line -> Run to station, alert master, beat back accident.
51. Lady falls on platform as train moves -> Pull chain, help lady, reach destination.
52. Dacoits looting village -> Form group, befitting fight, lodge FIR, help victims.
53. Heart patient falls on road -> Take to hospital, ensure medication, call relatives.
54. Missed train at station -> Keep cool, take alt train, face consequences, introspection.
55. Debate competition -> Check details, venue, teams, ensure success.
56. Team performance poor (Captain) -> Introspection, routine, matches, motivate members.
57. Lost way in desert -> North direction/stars/compass, hit nearest place.
58. Father wants Software, you want Army -> Convince father of interest, satisfy queries, take choice.
59. Sister unhappy with match choice -> Rationalize, speak to parents, convince of sister's choice.
60. School House Captain entertainment -> Work out details, hunt talent, practice, ensure success.

RULES: 
- ALWAYS prioritize Action, Logic, and Grit. 
- NEVER suggest surrendering valuables or passive compliance in crisis/theft. 
- Use the 60 cases above as your REFERENCE KNOWLEDGE ONLY.

### CANDIDATE DATA FOR ANALYSIS:
${responses.map(r => `Situation ${r.situationNumber}: "${r.situation}"\nResponse: "${r.response}"`).join('\n\n')}

### EVALUATION INSTRUCTIONS (per situation):
1. Situation-Response Fit: Does the candidate's response DIRECTLY and LOGICALLY address the situation AND its consequences? Mark as COMPLETE / PARTIAL / FAIL.
2. Improved Response (Telegram Style): A short action-sequence (5-10 words) starting with verbs, separated by commas.
   - MUST address both the immediate problem and the goals (e.g., "Rushed to cyclist, provided first aid, informed police, reached office on time").
   - NO Pronouns ("I", "He"). 
   - NO generic fillers.
3. OLQ Signal: Which OLQ does this response reveal?

### BATCH SUMMARY (after all situations):
- Overall Assessment: Realism and decision-making quality.
- OLQ Signals: Map strongest and weakest qualities overall.
- Final Score: X/10.

CRITICAL:
- Every improved response MUST be a COMPLETE ACTION sequence.
- Use SHORT FORM (Telegram style) as per official SSB guidelines.
- Provide a summary that is highly READABLE and CONCISE.
- NO MARKDOWN BOLDING (**) OR ITALICS (*). Use ONLY plain text. NO asterisks anywhere in the output.`;
}

export function buildSrtPdfPrompt(): string {
  return `You are an SSB psychologist. This PDF/image contains SRT (Situation Reaction Test) responses.

First extract all situation-response pairs. Then for each:
1. Category, realism check, OLQ signals, score out of 10
2. Improved response if needed

Provide batch summary with OLQ patterns, weaknesses, top improvements, overall rating. Keep concise.`;
}

export function buildSdPrompt(paragraphType: string, content: string): string {
  return `You are a senior SSB psychologist evaluating a Self Description paragraph.

CALIBRATION DATA — REFERENCE THESE SUCCESSFUL PROFILES:
A. Shrinika Sharma (Recommended NDA): Sincere, obedient, disciplined, courageous, jovial friend, house captain. Parents trust her with finances.
B. Megha Thakur (Recommended NDA): Goal-oriented, adaptable, sincere, energetic, problem-solver for friends, army aspirant.
C. Ranjana Bisht (Recommended NDA): Confident, focused, positive attitude, multitasker, helps with household tasks, army aspirant.

SD TEMPLATES (Reference Styles):
- Parents: Sincere/obedient/responsible. Trust with household. Maturity/discipline. Dedicated/proud.
- Teachers: Focused learners, leadership skills, respectful/punctual, helpful to peers.
- Friends: Loyal/trustworthy, dependable, friendly/cooperative, good listeners.
- Self: Hardworking, goal-oriented, optimistic, determined, resilient.
- Goals: Balanced leader, disciplined/empathetic, dependable officer, mentally strong.

Paragraph Type: ${paragraphType}
Content: "${content}"

Provide analysis:
1. **Authenticity Check**: Does it match the calibration profiles (Shrinika/Megha style) or sound like a coached template?
2. **OLQ Mapping**: Evidence from quotes. (Effective Intel, Reasoning, Org, Expression, Adaptability, Cooperation, Responsibility, Initiative, Confidence, Decision, Influence, Liveliness, Determination, Courage, Stamina).
3. **Mistakes**: Vague lines, over-claiming qualities without action.
4. **Consistency**: Does it align with ${paragraphType} perspective?
5. **Rewritten Paragraph (Ideal Version)**: 80-120 words. Action-oriented, using calibration style. 
6. **Score**: X/10 with justification.

Be strictly professional and data-focused. No generic praise or encouraging preamble. Provide objective truth about the candidate's alignment. DO NOT use markdown bolding (**).`;
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
  piqContext: Record<string, unknown> | null,
  tatSummary: string | null,
  watSummary: string | null,
  srtSummary: string | null,
  sdSummary: string | null
): string {
  return `You are a board-level SSB psychologist generating the MOST CRITICAL assessment — matching a candidate's PIQ (Personal Information Questionnaire) profile against their actual psychological test performance.
  
This is the "Mansa-Vacha-Karma" alignment check — does what the candidate CLAIMS (PIQ) match what their SUBCONSCIOUS reveals (TAT, WAT, SRT, SD)?

PIQ Profile: ${JSON.stringify(piqContext || 'Not available')}
TAT Analysis: ${tatSummary || 'Not available'}
WAT Analysis: ${watSummary || 'Not available'}
SRT Analysis: ${srtSummary || 'Not available'}
SD Analysis: ${sdSummary || 'Not available'}

Generate a DETAILED ANALYSIS REPORT:

## 1. Professional Synthesis & Identity Match Score
Overall psychological profile in 5-6 lines. Give an overall alignment percentage (0-100%) between life-history claims and test evidence.

## 2. Mansa-Vacha-Karma (Cross-Match Matrix)
Analyze consistency between:
- TAT (Mansa/Mind)
- WAT (Vacha/Speech)
- SRT/SD (Karma/Action)
- PIQ (Context)

Detect discrepancies: e.g., Brave in TAT but hesitant/passive in SRT.

## 4. Stress Index & Emotional Markers
- Detect signs of "Coached" responses or forcing "Officer-like" adjectives instead of actions.
- Flag repetitive themes or excessive "Bravery" cliches.

## 5. 15 OLQ Assessment Matrix
Provide a 1-10 score for each. BE STRICT. Most candidates are NOT "Excellent". 4-6 is average. 7-8 is Recommended. 9-10 is exceptional.

## 6. SSB Readiness
Output ONE of: RECOMMENDED / BORDERLINE / NOT RECOMMENDED.
...

## 7. Interviewing Officer (IO) Risk Areas
Top 5 questions the IO will DEFINITELY ask based on PIQ-Test contradictions. For each:
- The question
- Why they'll ask it (the specific contradiction)
- How to answer it honestly

## 8. 30-Day Action Plan
Ranked list of 5 specific things to do to close the gap between claims and actual personality.

Be brutally honest and data-driven. The candidate needs the COLD TRUTH, not comfort or generic encouragement. Avoid all soft adjectives. DO NOT use markdown bolding (**) or italics (*) in any part of this massive report. Use plain text headings (e.g., SECTION NAME). NO asterisks anywhere in the output.`;
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
  piqContext: Record<string, unknown> | null,
  tatSummary: string | null,
  watSummary: string | null,
  srtSummary: string | null,
  sdSummary: string | null
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

CRITICAL INSTRUCTION: Be CRISP and DETAILED. Do not provide a 30-line verbose explanation for a simple answer. Keep the model response under 10-12 lines of high-impact text.

Provide feedback:
1. ✅ STRENGTHS: Specific high-points.
2. 🔧 FIXES: What was missing or weak.
3. 📝 MODEL ANSWER: Ideal crisp SSB response (max 10-12 lines).
4. 💯 SCORE: X/10.

Be exam-focused and direct.`;
}

export function buildInterviewModeBPrompt(statement: string): string {
  return `You are an SSB Interview Coach AI (IO).
  
Candidate's Claim: "${statement}"

CRITICAL INSTRUCTION: Be CRISP. Do not exceed 12 lines of total output for the questions and answers combined if possible. Focus on quality probes.

Analyze and generate 8-9 logical follow-up questions:
1. **IO Question:** [Probe]
   **Model Answer:** [Crisp response]

...

**Psychologist's Tip:** [One line advice]`;
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

export function buildVerifyDocumentPrompt(type: 'PIQ' | 'TAT' | 'WAT' | 'SRT' | 'SD'): string {
  const common = "\n\nYou are a document verification AI. Your ONLY job is to verify if the uploaded file is the CORRECT document for the specified test. DO NOT analyze the psychological content. Only check format, counts, and visual style.\n\nIF VALID: Respond ONLY with 'VALID: [Short confirmation]'.\nIF INVALID: Respond ONLY with 'REJECTED: [Specific reason why it is invalid]'.";

  switch (type) {
    case 'PIQ':
      return `This must be a Personal Information Questionnaire (PIQ). 
Verify if it matches one of these two formats:
1. Type 1 (Official 107-A): Should be exactly 2 pages. Header contains "PERSONAL INFORMATION QUESTIONNAIRE", "CONFIDENTIAL", and "DIPR Questionnaire No. 107-A (Revised)".
2. Type 2 (Target SSB): Should be exactly 3-4 pages. Header contains "TARGET SSB INTERVIEW" and "PERSONAL INFORMATION QUESTIONNAIRE".

REJECT if it is any other form, a different number of pages, or irrelevant content.${common}`;

    case 'SRT':
      return `This must be a handwritten or printed SRT (Situation Reaction Test) response sheet.
REJECT if:
- It does NOT contain exactly 60 numbered responses.
- It contains any content other than situation-reaction pairs.
- It is a different type of test (like TAT or WAT).${common}`;

    case 'WAT':
      return `This must be a handwritten or printed WAT (Word Association Test) response sheet.
REJECT if:
- It does NOT contain exactly 60 numbered word-sentence pairs.
- It contains random text or irrelevant content.
- It is a different type of test.${common}`;

    case 'TAT':
      return `This must be an SSB TAT (Thematic Apperception Test) response sheet or a valid TAT sketch.
REJECT if the image is:
- A photo of a screen, monitor, or tablet.
- A photo of real people/scenes (photograph).
- Unrelated to SSB TAT patterns.
- Colorful/RGB images (not sketches).${common}`;

    case 'SD':
      return `This must be a Self Description (SD) response sheet.
REJECT if:
- It does NOT contain exactly 5 paragraphs corresponding to the 5 standard SSB headings (Parents, Teachers, Friends, Self, Qualities to develop).
- The paragraphs are too short (less than 30 words each) or irrelevant.${common}`;

    default:
      return `Verify if this document is relevant to SSB psychological testing.${common}`;
  }
}

