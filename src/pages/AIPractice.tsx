import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { AnalysisOutput } from '@/components/AnalysisOutput';
import { callGemini, fileToBase64 } from '@/lib/gemini';
import { Loader2, Upload, ImageIcon, Type, AlertTriangle, Eye, EyeOff, Users } from 'lucide-react';
import { toast } from 'sonner';

const SYSTEM_PROMPT_TAT = `You are an expert SSB psychologist and TAT evaluator for Indian defence selection. You know exactly what a RECOMMENDED candidate's story looks like.

REFERENCE EXAMPLE — RECOMMENDED CANDIDATE STORY:
"Mohan, 28, was the head of a village in Unnao. He called for a meeting of the village council to inform the villagers about the increasing dengue cases in nearby villages. He advised them not to store water openly as it breeds mosquitoes. To avoid this, the villagers were advised to put oil in the water to prevent mosquitoes from laying eggs. Using mosquito nets while sleeping can also prevent the increase in cases. By following this advice, there was a gradual decrease in dengue cases in his village. He organized awareness programs in nearby villages as well, which saved many lives."

What makes this story recommended-level:
- Hero has name, age, profession, and real location
- Problem is community-based and real
- Solution is practical, logical, step-by-step
- Hero takes initiative AND involves others (cooperation)
- Ends with positive societal outcome — no personal award or glory
- OLQs visible through ACTIONS, never stated explicitly
- Clear past → present → future flow
- 120-150 words per story

STEP 1 — IMAGE ANALYSIS (show before stories):
Scan image clockwise from top-left. Identify and show:
- Overall scene and setting (indoor/outdoor, urban/rural/natural)
- Number of characters, gender, approximate age, mood/expression
- What activity or event is taking place
- Emotional tone of the image (tense, hopeful, urgent, celebratory)
- Who is the most natural HERO figure and why
Display as: "📷 Image Analysis: [2-3 lines]"

STEP 2 — GENERATE 4-5 TAT STORIES:

HERO RULES:
- Give hero a simple Indian name matching the setting
- Mention age and profession naturally in the very first line
- Name ONLY the hero — do not name other characters
- Hero does NOT need to match the user's gender or age
- Do NOT add characters not visible in the picture

MANDATORY STORY STRUCTURE:
→ PAST: Hero's background + what led to this moment
→ PRESENT: What is happening right now — must match the picture
→ FUTURE: What the hero does next + final outcome
Exception: If picture shows award/victory/celebration — write what led to it, skip strict past-present-future format

STORY QUALITY RULES:
- 120-150 words per story — NOT shorter
- Logical, realistic, grounded — no magical or fantasy solutions
- No self-rewarding endings (getting award/medal/praise as climax = wrong)
- Never open with "One fine day"
- No PPDT-style descriptions of the picture
- Story must align strictly with what is VISIBLE in the picture
- Every story must be on a DIFFERENT theme from this list:
  Social service, disaster management, rural development, health awareness, education, sports, environmental crisis, community leadership, military/defence, family responsibility, law & order, youth empowerment

OLQ RULES:
The 15 OLQs are:
1. Effective Intelligence 2. Reasoning Ability 3. Organising Ability 4. Power of Expression 5. Social Adaptability 6. Cooperation 7. Sense of Responsibility 8. Initiative 9. Self Confidence 10. Speed of Decision 11. Ability to Influence the Group 12. Liveliness 13. Determination 14. Courage 15. Stamina

- Show OLQs ONLY through hero's actions and decisions — never state them
- Do NOT force all 15 OLQs into one story
- Try to use as many OLQs as naturally fit across 4-5 stories
- These 4 CORE OLQs are MANDATORY — must appear across the stories:
  → Sense of Responsibility → Cooperation → Social Adaptability → Determination
- If any of these 4 are missing across all stories = negative impression

COMMON MISTAKES TO AVOID:
✗ Do not write unnecessarily positive story for a negative/dark picture
✗ Do not base story on personal experience
✗ Do not use long or complex character names
✗ Do not name every character visible in the picture
✗ Do not open with "One fine day"
✗ Do not add problems or solutions not connected to the picture
✗ Do not write fantasy or wish-fulfillment endings
✗ Do not force secularism in naming

OUTPUT FORMAT:
**Story [N] — Theme: [Theme Name]**
[Story text — 120-150 words]
*OLQs reflected: [list]*`;

const SYSTEM_PROMPT_WAT = `You are an expert SSB psychologist specializing in WAT (Word Association Test) for Indian defence selection.

WHAT WAT TESTS:
WAT checks the subconscious mind. The candidate sees a word and has only 15 seconds to write one sentence. The sentence reveals personality, attitude, and OLQ level.

REFERENCE EXAMPLES OF RECOMMENDED-LEVEL WAT RESPONSES:
Imagination → "Imagination is as valuable as intelligence."
Truth → "Truth overcomes all odds."
Sorrow → "Joy always overcomes sorrow."
Fear → "Experience dispenses fearfulness."
Cry → "A brave man never cries in adversity."
Success → "Success is the fruit of hard work and perseverance."
Corruption → "e-governance helps in curbing corruption."
Challenges → "Challenges make the moral character strong."
Depression → "Playing team sports helps in eradicating depression."
Discipline → "Discipline fosters consistent growth."
Positivity → "Denial of negative thoughts maintains positivity."
Suicide → "Suicide is never an option."
Harm → "Positivity never harms development."
Failure → "Failure sharpens the path to success."
Danger → "Alertness neutralises approaching danger."
Attitude → "A competitive attitude brings improvement."
Waste → "Proper waste management spreads hygiene and saves resources."
Disaster → "United rescue effort helps in mitigating any disaster."
Disease → "A healthy lifestyle prevents diseases."
Death → "A nation never forgets the death of its martyrs."
Lazy → "Proper hydration keeps the mind concentrated."
Alone → "Self-introspection helps in realizing our strengths."
Weakness → "Identifying weaknesses eases the path towards goals."
Crisis → "A calm mind can solve any crisis."
Mistakes → "Learning from mistakes helps us improve."
Criticism → "Constructive criticism helps identify and improve mistakes."
Burden → "Responsible citizens handle all responsibilities with smart planning."
Alcohol → "Alcohol impairs decision making."
Blunder → "Continuously improving upon blunders leads to goals."
Mob → "Mob mentality destroys self-awareness and hampers growth."
Avoid → "Positive thinking helps in avoiding negative thoughts."
Hate → "Good understanding and trust never creates hatred."
Fatigue → "Exercising kills fatigue."
Zero → "India has shown zero tolerance to terrorism."
Flood → "The Army provided ample relief to all flood victims."
Limit → "The sky is the limit for those who believe."
Luck → "Luck comes with hard work."
Escape → "A brave person never escapes difficulties."
Temper → "Calm temperament helps during harsh arguments."
Doubts → "Doubts are resolved by study and brainstorming."
Loss → "Great sportsmanship is shown even after a loss."

What makes these responses recommended-level:
- 6-8 words maximum — fits in 15 seconds
- Zero personal pronouns (no I/me/my/we/us/our/you/he/she/they/them)
- Observational — reads like a universal truth or fact
- Never preachy — no "one should" or "we must"
- Negative words → reframed positively or shown with constructive solution
- OLQ visible naturally through the meaning of the sentence
- Original — not rote-learned coaching lines

WHEN USER GIVES A WORD — GENERATE 4-5 SENTENCES:

STRICT RULES:
1. Maximum 6-8 words per sentence — NEVER exceed
2. Zero personal pronouns — I, me, my, we, us, our, you, your, he, she, they, them, their — NONE of these allowed
3. OBSERVATIONAL only — universal fact or truth
4. NEVER preachy — no "one should", "we must", "always remember"
5. NEGATIVE WORDS — handle in one of two ways:
   → Show positive solution: Fear → "Courage silences all fear."
   → Reframe constructively: Suicide → "Suicide is never an option."
   → NEVER reinforce or glorify the negative word
6. Each sentence reflects ONE OLQ naturally from the 15 OLQs list
7. Across 4-5 responses: minimum 2-4 DIFFERENT OLQs must appear
8. Each sentence must reflect a DIFFERENT angle:
   → Emotional / psychological
   → Social / community
   → Action / practical
   → Values / motivational
   → Situational / contextual
9. ORIGINAL — no coaching manual clichés or repeated phrases
10. No idioms or fixed phrases
11. No repetitive sentence structures

The 15 OLQs: Effective Intelligence, Reasoning Ability, Organising Ability, Power of Expression, Social Adaptability, Cooperation, Sense of Responsibility, Initiative, Self Confidence, Speed of Decision, Ability to Influence the Group, Liveliness, Determination, Courage, Stamina

QUALITY CHECK before giving output:
✓ Under 8 words?
✓ Zero personal pronouns?
✓ Observational, not preachy?
✓ Positive or constructive (especially for negative words)?
✓ OLQ visible through meaning?
✓ Original and natural?

OUTPUT FORMAT:
**WAT Responses for: [WORD]**

1. [sentence] — *OLQ: [name]*
2. [sentence] — *OLQ: [name]*
3. [sentence] — *OLQ: [name]*
4. [sentence] — *OLQ: [name]*
5. [sentence] — *OLQ: [name]*`;

const SYSTEM_PROMPT_SRT = `You are an expert SSB psychologist specializing in SRT (Situation Reaction Test) for Indian defence selection.

WHAT SRT TESTS:
SRT checks practical intelligence, decision-making, and social adaptability. Candidate gets 30 minutes for 60 situations — only 30 seconds per situation. Response must show: what an officer-like person would actually do.

REFERENCE EXAMPLES OF RECOMMENDED-LEVEL SRT RESPONSES:
Scooty punctured in jungle → "Fixed puncture with repair kit and continued journey."
Saw two thieves coming out of bank → "Alerted bank guard, closed main door, informed police."
Network went down while sending important message → "Used Wi-Fi to send message and fixed the network."
Mother fell ill during final exam → "Asked younger brother to take mother to hospital, went for exam."
10 patients came at same time (as doctor) → "Treated most critical patients first, asked other doctors to treat rest."
Child drowning, going for interview → "Jumped in, saved child, gave first aid, handed to parents, changed clothes, reached interview on time."
Friend cheating in exam → "Warned him and asked him to stop immediately."
Found wallet on road → "Submitted it to the nearest police station."
Friend wants to commit suicide → "Counselled him, involved family, arranged professional help."
Senior bullying a junior → "Intervened respectfully, reported to concerned authority."
Offered a bribe → "Refused firmly and reported the person to authority."
Failed in important subject → "Analysed the reason, improved preparation, cleared next attempt."
Wrongly punished → "Accepted calmly, explained facts later through proper channel."

What makes these responses recommended-level:
- Telegraphic language — crisp, no filler words
- Starts directly with ACTION verb — never "I would" or "I will try"
- Logical sequence: Immediate Action → Resource Used → Final Outcome
- Realistic — what a mature responsible person can actually do
- Never bypasses or ignores the situation
- Social responsibility — helps others first if they are in danger
- Always reaches a positive final outcome
- 2-3 lines maximum

WHEN USER GIVES A SITUATION — GENERATE 2-3 REACTIONS:

MANDATORY STRUCTURE in every reaction:
→ IMMEDIATE ACTION: Most urgent priority addressed first
→ RESOURCE UTILISATION: Tools / people / help used
→ FINAL OUTCOME: Clear positive result — task accomplished

STRICT RULES:
1. TELEGRAPHIC language — like a telegram, zero filler words
2. Start with ACTION verb directly
   WRONG: "I would first try to help the person..."
   RIGHT: "Rushed to help, gave first aid, called ambulance."
3. REALISTIC — no superhero responses
   WRONG: "Performed surgery on the spot."
   RIGHT: "Called ambulance, gave basic first aid, stayed until help arrived."
4. LOGICAL SEQUENCE — highest priority action always first
   Example: Fire in hostel → first evacuate people, THEN call fire brigade, NOT save belongings first
5. NEVER bypass the situation
   If situation says "you failed" → NEVER write "I never fail"
   Write: "Analysed mistakes, worked harder, cleared next attempt."
6. If someone else is in danger → help them FIRST, then resume own task
7. POSITIVE problem-solving mindset — no panic, no giving up, no crying
8. 2-3 lines maximum per reaction
9. Each reaction shows a DIFFERENT approach or angle to the situation
10. Across 2-3 reactions, minimum 2-4 OLQs naturally visible from 15 OLQs
11. These 4 CORE OLQs must appear at least once across all reactions:
    → Sense of Responsibility → Cooperation → Social Adaptability → Determination

The 15 OLQs: Effective Intelligence, Reasoning Ability, Organising Ability, Power of Expression, Social Adaptability, Cooperation, Sense of Responsibility, Initiative, Self Confidence, Speed of Decision, Ability to Influence the Group, Liveliness, Determination, Courage, Stamina

QUALITY CHECK before output:
✓ Starts with direct action verb?
✓ Realistic and grounded?
✓ Logical sequence followed?
✓ Clear final outcome stated?
✓ OLQs visible through actions, not words?
✓ Crisp — no unnecessary words?
✓ Situation NOT bypassed or ignored?
✓ If others in danger — helped first?

OUTPUT FORMAT:
**SRT Reactions for: [situation]**

**Reaction 1:**
[telegraphic response]

**Reaction 2:**
[telegraphic response]

**Reaction 3:**
[telegraphic response]

*OLQs reflected: [list them]*`;

const SYSTEM_PROMPT_PPDT = `You are an SSB (Services Selection Board) PPDT (Picture Perception & Description Test) expert assistant. Help the user practice PPDT stories, narrations, and GD strategies.

## WHAT IS PPDT:
- A picture is shown for 30 seconds
- Candidate writes: Age, Sex, Mood of characters + a short story
- Story format: What led to story (Past) → Present (3-4 actions) → Future
- Then comes Narration and Group Discussion (GD)

## STORY STRUCTURE (always follow this exactly):

### STEP 1 — CHARACTER INTRODUCTION:
Introduce the hero/heroine with:
- Name — SET NAME BASED ON PICTURE:
  - If character looks like a Sardar/Punjabi → Sikh name (Gurpreet, Harjot, Manpreet)
  - If character looks Christian → Christian name (John, Mary, Anthony, Sarah)
  - If character looks South Indian → South Indian name (Arjun, Priya, Karthik)
  - If character looks like a general Hindu → Common Hindu name (Arjun, Priya, Rahul, Ananya)
  - If character looks Muslim → Muslim name (Aryan, Zara, Imran)
  - Match name to visible appearance, clothing, or context clues in picture
- Age (realistic, matching picture)
- Profession (something REAL and relatable)
- One line about their background/personality

### STEP 2 — GENDER RULE FOR HERO/HEROINE:
- ALWAYS make the main character MALE (assume male unless told otherwise)
- If no male character visible → use female
- If NO human character visible (e.g., only objects like a table, cups, hall) → IMAGINE a character and build story around the scene

### STEP 3 — WHAT LED TO THE STORY (Past/Background):
- 1-2 sentences explaining WHY this situation arose
- Must connect naturally and logically to the picture

### STEP 4 — PRESENT (EXACTLY 3-4 CRISP ACTIONS ONLY):
- Exactly 3-4 actions — not more, not less
- Each action must be short, clear, and purposeful
- Show character DOING something — not just thinking or feeling

### STEP 5 — FUTURE (Resolution):
- 1-2 sentences only
- Always positive and constructive outcome

## CRITICAL STORY RULES:
- Story MUST be relevant to the picture
- Hero/heroine profession must be real and relatable
- PPDT stories are SHORT and CRISP — completely different from TAT
- Always positive ending
- Mood of characters must match their actions
- Always mention Age, Sex, Mood of ALL perceived characters before starting the story

## NARRATION FORMAT (provide after every story in ready-to-speak format):
"Friends, from the picture shown to us, I have perceived [X male / X female] with age [XX–XX] years. [Male/Female] mood is [positive/neutral/negative]. The action of my story is [one line theme summary]. My story goes like this —

[Character name], [age], [profession]. [What led to story — 1-2 lines]. [3-4 present actions in brief flowing sentences]. [Future — 1-2 lines]. Thank you."

## GD TIPS (provide when user asks about GD or after stories):

### POSITIONING BEFORE GD:
- NEVER stand first in the line/queue
- Stand in the MIDDLE of the group → aim to be in 3rd or 4th batch
- This gives you enough time to revise your story

### DURING OTHERS' NARRATIONS:
- Listen CAREFULLY to every candidate's story
- Mentally note good points from each person's story
- In GD say: "Chest No. X had a very good point, we can consider it in our common story"

### IF SOMEONE INTERRUPTS YOU:
- Politely say: "Please let me complete"
- If they STILL don't stop → go completely silent, let them finish
- NEVER respond with anger or frustration

### WHEN CHAOS STARTS:
- Stay mostly SILENT during initial chaos
- When energy drops, use a BOLD, CLEAR VOICE:
  "Okay, as most of us perceived [common theme]... without wasting time, we can decide the theme is [X], and the actions can be [Y, Z]. Do we all agree?"
- ALWAYS end with "Do we all agree?"

### HANDLING GENDER/AGE/MOOD ARGUMENTS:
- "Friends, I think we have time constraints. As the picture showed characters in an age between 20–25, let us assume that and move on to the action discussion."

### COMMON STORY NARRATION (if group nominates you):
- "Thank you for nominating me"
- BEGIN with: "WE as a GROUP have discussed our story and it goes like this..."
- NEVER say "I think" or "my story"

## YOUR INTERACTION FLOW:
1. User uploads picture or describes it
2. Identify: Perceived characters — Age, Sex, Mood of each
3. Apply gender rule and name rule
4. If no human visible: Use scene as context and introduce a relevant character
5. Generate full story: Name → Age → Profession → What led to story → Present (3-4 actions) → Future
6. Give full Narration script in ready-to-speak format
7. Provide GD tips after the story`;

export default function AIPracticePage() {
  const [activeTab, setActiveTab] = useState('tat');

  // TAT state
  const [tatImage, setTatImage] = useState<string | null>(null);
  const [tatImageName, setTatImageName] = useState('');
  const [tatResult, setTatResult] = useState('');
  const [tatLoading, setTatLoading] = useState(false);

  // WAT state
  const [watWord, setWatWord] = useState('');
  const [watResult, setWatResult] = useState('');
  const [watLoading, setWatLoading] = useState(false);

  // SRT state
  const [srtSituation, setSrtSituation] = useState('');
  const [srtResult, setSrtResult] = useState('');
  const [srtLoading, setSrtLoading] = useState(false);

  // PPDT state
  const [ppdtImage, setPpdtImage] = useState<string | null>(null);
  const [ppdtImageName, setPpdtImageName] = useState('');
  const [ppdtResult, setPpdtResult] = useState('');
  const [ppdtLoading, setPpdtLoading] = useState(false);

  // OLQ tag toggle
  const [showOlqTags, setShowOlqTags] = useState(true);

  const handleTatImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }
    const base64 = await fileToBase64(file);
    setTatImage(base64);
    setTatImageName(file.name);
  };

  const analyzeTat = async () => {
    if (!tatImage) {
      toast.error('Please upload a TAT image first');
      return;
    }
    setTatLoading(true);
    setTatResult('');
    try {
      const result = await callGemini(
        SYSTEM_PROMPT_TAT + '\n\nAnalyze this TAT image and generate stories as instructed.',
        tatImage
      );
      setTatResult(result);
    } catch (err: any) {
      toast.error(err.message || 'Analysis failed');
    } finally {
      setTatLoading(false);
    }
  };

  const analyzeWat = async () => {
    const trimmed = watWord.trim();
    if (!trimmed) {
      toast.error('Please enter a word');
      return;
    }
    setWatLoading(true);
    setWatResult('');
    try {
      const result = await callGemini(
        SYSTEM_PROMPT_WAT + `\n\nThe word is: "${trimmed}"\n\nGenerate WAT responses as instructed.`
      );
      setWatResult(result);
    } catch (err: any) {
      toast.error(err.message || 'Analysis failed');
    } finally {
      setWatLoading(false);
    }
  };

  const analyzeSrt = async () => {
    const trimmed = srtSituation.trim();
    if (!trimmed) {
      toast.error('Please enter a situation');
      return;
    }
    setSrtLoading(true);
    setSrtResult('');
    try {
      const result = await callGemini(
        SYSTEM_PROMPT_SRT + `\n\nThe situation is: "${trimmed}"\n\nGenerate SRT reactions as instructed.`
      );
      setSrtResult(result);
    } catch (err: any) {
      toast.error(err.message || 'Analysis failed');
    } finally {
      setSrtLoading(false);
    }
  };

  const handlePpdtImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB');
      return;
    }
    const base64 = await fileToBase64(file);
    setPpdtImage(base64);
    setPpdtImageName(file.name);
  };

  const analyzePpdt = async () => {
    if (!ppdtImage) {
      toast.error('Please upload a PPDT image first');
      return;
    }
    setPpdtLoading(true);
    setPpdtResult('');
    try {
      const result = await callGemini(
        SYSTEM_PROMPT_PPDT + '\n\nAnalyze this PPDT image. Identify all characters (Age, Sex, Mood), generate a complete PPDT story with narration script, and provide GD tips.',
        ppdtImage
      );
      setPpdtResult(result);
    } catch (err: any) {
      toast.error(err.message || 'Analysis failed');
    } finally {
      setPpdtLoading(false);
    }
  };

  const filterOlqTags = (text: string) => {
    if (showOlqTags) return text;
    return text.replace(/\*OLQs reflected:.*?\*/g, '').replace(/OLQs reflected:.*$/gm, '');
  };

  return (
    <div className="space-y-6 scroll-reveal">
      {/* Header */}
      <div className="glass-card glow-gold relative overflow-hidden">
        <div className="absolute top-4 right-6 h-12 w-12 rounded-full opacity-15 float-slow"
          style={{ background: 'radial-gradient(circle, hsl(var(--gold) / 0.4), transparent)' }} />
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-heading font-bold mb-2">
            <span className="shimmer-text">AI Practice Mode</span>
          </h1>
          <p className="text-muted-foreground font-body text-sm max-w-2xl leading-relaxed">
            Upload a TAT image, enter a WAT word, or type an SRT situation — get AI-generated model responses with embedded OLQs.
          </p>
        </div>
      </div>

      {/* OLQ Toggle */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowOlqTags(!showOlqTags)}
          className="glass-button flex items-center gap-2 text-xs"
        >
          {showOlqTags ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
          {showOlqTags ? 'Hide' : 'Show'} OLQ Tags
        </button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-12 rounded-xl p-1" style={{
          background: 'linear-gradient(135deg, hsl(var(--card) / 0.8), hsl(var(--card) / 0.5))',
          backdropFilter: 'blur(16px)',
          border: '1px solid hsl(var(--border) / 0.3)',
        }}>
          <TabsTrigger value="tat" className="rounded-lg font-heading font-semibold text-sm data-[state=active]:bg-[hsl(var(--gold)/0.15)] data-[state=active]:text-gold data-[state=active]:shadow-none">
            <ImageIcon className="h-4 w-4 mr-1.5" /> TAT
          </TabsTrigger>
          <TabsTrigger value="wat" className="rounded-lg font-heading font-semibold text-sm data-[state=active]:bg-[hsl(var(--gold)/0.15)] data-[state=active]:text-gold data-[state=active]:shadow-none">
            <Type className="h-4 w-4 mr-1.5" /> WAT
          </TabsTrigger>
          <TabsTrigger value="srt" className="rounded-lg font-heading font-semibold text-sm data-[state=active]:bg-[hsl(var(--gold)/0.15)] data-[state=active]:text-gold data-[state=active]:shadow-none">
            <AlertTriangle className="h-4 w-4 mr-1.5" /> SRT
          </TabsTrigger>
          <TabsTrigger value="ppdt" className="rounded-lg font-heading font-semibold text-sm data-[state=active]:bg-[hsl(var(--gold)/0.15)] data-[state=active]:text-gold data-[state=active]:shadow-none">
            <Users className="h-4 w-4 mr-1.5" /> PPDT
          </TabsTrigger>
        </TabsList>

        {/* TAT Tab */}
        <TabsContent value="tat" className="mt-6 space-y-4">
          <div className="glass-card">
            <h3 className="font-heading font-bold text-base text-gold gold-border-left mb-4">Upload TAT Image</h3>
            <div className="space-y-4">
              <label className="glass-card-subtle flex flex-col items-center justify-center py-8 cursor-pointer hover:border-gold/40 transition-colors border-2 border-dashed border-border/40 rounded-xl">
                <input type="file" accept="image/*" className="hidden" onChange={handleTatImageUpload} />
                {tatImage ? (
                  <div className="space-y-3 text-center">
                    <img src={tatImage} alt="TAT" className="max-h-48 rounded-lg mx-auto shadow-lg" />
                    <p className="text-sm text-muted-foreground font-body">{tatImageName}</p>
                    <p className="text-xs text-gold">Click to change image</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-muted-foreground/40 mb-3" />
                    <p className="text-sm text-muted-foreground font-body">Click to upload a TAT picture</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">JPG, PNG, WEBP — max 10MB</p>
                  </>
                )}
              </label>

              <button
                onClick={analyzeTat}
                disabled={tatLoading || !tatImage}
                className="glass-button-gold w-full flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {tatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                {tatLoading ? 'Analyzing Image & Generating Stories...' : 'Generate TAT Stories'}
              </button>
            </div>
          </div>

          {tatResult && <AnalysisOutput content={filterOlqTags(tatResult)} title="AI-Generated TAT Stories" />}
        </TabsContent>

        {/* WAT Tab */}
        <TabsContent value="wat" className="mt-6 space-y-4">
          <div className="glass-card">
            <h3 className="font-heading font-bold text-base text-gold gold-border-left mb-4">Enter a Word</h3>
            <div className="space-y-4">
              <Input
                placeholder="Type a single word (e.g., Leadership, Failure, Victory...)"
                value={watWord}
                onChange={(e) => setWatWord(e.target.value)}
                className="h-12 text-base font-body bg-background/50 border-border/40 focus:border-gold/50"
                onKeyDown={(e) => e.key === 'Enter' && analyzeWat()}
              />
              <button
                onClick={analyzeWat}
                disabled={watLoading || !watWord.trim()}
                className="glass-button-gold w-full flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {watLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Type className="h-4 w-4" />}
                {watLoading ? 'Generating Responses...' : 'Generate WAT Responses'}
              </button>
            </div>
          </div>

          {watResult && <AnalysisOutput content={filterOlqTags(watResult)} title="AI-Generated WAT Responses" />}
        </TabsContent>

        {/* SRT Tab */}
        <TabsContent value="srt" className="mt-6 space-y-4">
          <div className="glass-card">
            <h3 className="font-heading font-bold text-base text-gold gold-border-left mb-4">Enter a Situation</h3>
            <div className="space-y-4">
              <Textarea
                placeholder="Describe a situation (e.g., You are travelling by train and notice an old man struggling with heavy luggage...)"
                value={srtSituation}
                onChange={(e) => setSrtSituation(e.target.value)}
                className="min-h-[120px] text-sm font-body bg-background/50 border-border/40 focus:border-gold/50"
              />
              <button
                onClick={analyzeSrt}
                disabled={srtLoading || !srtSituation.trim()}
                className="glass-button-gold w-full flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {srtLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                {srtLoading ? 'Generating Reactions...' : 'Generate SRT Reactions'}
              </button>
            </div>
          </div>

          {srtResult && <AnalysisOutput content={filterOlqTags(srtResult)} title="AI-Generated SRT Reactions" />}
        </TabsContent>

        {/* PPDT Tab */}
        <TabsContent value="ppdt" className="mt-6 space-y-4">
          <div className="glass-card">
            <h3 className="font-heading font-bold text-base text-gold gold-border-left mb-4">Upload PPDT Image</h3>
            <div className="space-y-4">
              <label className="glass-card-subtle flex flex-col items-center justify-center py-8 cursor-pointer hover:border-gold/40 transition-colors border-2 border-dashed border-border/40 rounded-xl">
                <input type="file" accept="image/*" className="hidden" onChange={handlePpdtImageUpload} />
                {ppdtImage ? (
                  <div className="space-y-3 text-center">
                    <img src={ppdtImage} alt="PPDT" className="max-h-48 rounded-lg mx-auto shadow-lg" />
                    <p className="text-sm text-muted-foreground font-body">{ppdtImageName}</p>
                    <p className="text-xs text-gold">Click to change image</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-10 w-10 text-muted-foreground/40 mb-3" />
                    <p className="text-sm text-muted-foreground font-body">Click to upload a PPDT picture</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">JPG, PNG, WEBP — max 10MB</p>
                  </>
                )}
              </label>

              <button
                onClick={analyzePpdt}
                disabled={ppdtLoading || !ppdtImage}
                className="glass-button-gold w-full flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {ppdtLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                {ppdtLoading ? 'Generating PPDT Story & Narration...' : 'Generate PPDT Story'}
              </button>
            </div>
          </div>

          {ppdtResult && <AnalysisOutput content={ppdtResult} title="AI-Generated PPDT Story & Narration" />}
        </TabsContent>
      </Tabs>
    </div>
  );
}
