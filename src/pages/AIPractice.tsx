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

const SYSTEM_PROMPT_PPDT = `You are an SSB (Services Selection Board) PPDT (Picture Perception & Description Test) expert assistant.

IMPORTANT — PPDT vs TAT DIFFERENCE:
- PPDT: SHORT and CRISP story (60-80 words). Tests communication, leadership, group dynamics, ability to present and defend ideas. Interpersonal skills. Clarity under time pressure.
- TAT: LONGER detailed story (120-150 words). Tests individual personality profiling — needs, motives, emotional stability, imagination, depth of inner drives.
- PPDT story is what you WRITE in 4 minutes and NARRATE in 1 minute. It must be concise enough to speak aloud.
- TAT story reveals deeper psychology. PPDT story shows practical leadership.

STEP 1 — DEEP IMAGE ANALYSIS (show first):
Scan the picture carefully. Identify:
- Number of characters visible (if blurred, say "few male / few female")
- For each character: approximate Age, Sex (Male/Female), Mood (Positive/Neutral/Negative)
- Setting, objects, activity happening
- Who is the most natural hero figure

Display as:
**📷 Picture Analysis:**
**Characters perceived:** [X male, Y female] (or "few male, few female" if blurred)
**Character Details:**
| Character | Sex | Age | Mood |
|-----------|-----|-----|------|
| 1 | Male | 23 | Positive |
| 2 | Female | 25 | Neutral |

STEP 2 — DETERMINE THEME COUNT:
Based on the picture, determine how many DIFFERENT themes are realistically possible (usually 2-4 for PPDT).
Tell the user: "Based on this picture, I can generate [N] different themes. This is the maximum number of realistic stories possible for this image."
Do NOT generate more themes than what the picture supports. Be honest about limits.

STEP 3 — GENERATE PPDT STORIES (one per theme):

HERO RULES:
- ALWAYS make hero MALE unless told otherwise
- SET NAME BASED ON PICTURE:
  - Sardar/Punjabi appearance → Sikh name (Gurpreet, Harjot, Manpreet)
  - Christian appearance → Christian name (John, Mary, Anthony)
  - South Indian appearance → South Indian name (Arjun, Karthik, Priya)
  - General Hindu appearance → Hindu name (Arjun, Rahul, Ananya)
  - Muslim appearance → Muslim name (Aryan, Zara, Imran)
- If NO human visible → IMAGINE a character based on the scene context
- Prefer the character with POSITIVE MOOD as the hero
- Hero must be shown HELPING others, taking initiative — NEVER under pressure or needing help

MANDATORY STORY STRUCTURE (60-80 words per story):
1. **Character Introduction:** [Name], [age], [profession from a real field]. One line about background.
2. **What led to the story (Past):** 1-2 sentences — why this situation arose. Must connect to picture.
3. **Present (EXACTLY 3-4 crisp actions):** Short, clear, purposeful actions. Hero DOING things. Logically connected.
4. **Future (Resolution):** 1-2 sentences. Positive and constructive outcome. Growth, contribution to society.

CRITICAL RULES:
- Story MUST be relevant to what is VISIBLE in the picture — never go off track
- Hero must be PROACTIVE — taking initiative, leading, helping others
- NEVER show hero as weak, under pressure, needing help, or negative
- Always POSITIVE ending
- Realistic, logical, grounded — no fantasy or wishful thinking
- Do NOT repeat the same story with slight variations on re-generation
- Each theme must be genuinely different

REFERENCE PPDT EXAMPLES (follow this style exactly):

Example 1: "Sumit, a 23-year-old postgraduate student, noticed a crowd of villagers gathered around the Panchayat notice board in his hometown. Upon approaching, he realised that many were struggling to understand the complex eligibility criteria for a newly launched government skill-development scheme. Sensing their confusion, Sumit took the initiative to simplify the information. He spent the afternoon researching the scheme's details on his laptop and then returned to the board. He pinned up a handwritten, easy-to-read chart in the local language, outlining the necessary documents and the application deadline. He also organised a small briefing in the community hall to explain how the vocational training could lead to local employment. Sumit assisted ten youngsters in filling out their digital applications using his own data connection."

Example 2: "Arjun, a 23-year-old Civil Engineering student, returned to his hilly hometown for his summer break. During a trek, he noticed the old suspension bridge over the local river had developed loose cables and decaying wooden planks. Realising the danger it posed to daily commuters and children, Arjun decided to act. He immediately conducted a basic safety audit and met the Village Pradhan. Using his technical knowledge, Arjun drafted a simple repair proposal and estimated the material requirements. He motivated the village youth to contribute voluntary labour (Shramdaan) while the Panchayat provided the funds for steel wires and treated timber. Under Arjun's supervision, the group tightened the supports and replaced the worn-out planks within four days."

OUTPUT FORMAT FOR EACH STORY:

**PPDT Story [N] — Theme: [Theme Name]**

**Characters:** [X male, Y female] | Ages: [range] | Mood: [positive/neutral/negative]

**Story:**
[Name], [age], [profession]. [What led to the story]. [3-4 present actions]. [Future resolution].

**Narration Script (ready-to-speak):**
"Friends, from the picture shown to us, I have perceived [X male / X female] with age [XX–XX] years. [Male/Female] mood is [positive/neutral/negative]. The action of my story is [one line theme summary]. My story goes like this —

[Character name], [age], [profession]. [What led to story — 1-2 lines]. [3-4 present actions in brief flowing sentences]. [Future — 1-2 lines]. Thank you."

---

After all stories, provide:
**📌 Key Differences: PPDT vs TAT**
- PPDT is SHORT (60-80 words), TAT is LONGER (120-150 words)
- PPDT tests communication & group dynamics; TAT tests individual personality & motives
- PPDT story should be easy to narrate in 1 minute
- TAT story reveals deeper drives and emotional maturity

**💬 GD Tips:**
- Stand in MIDDLE of queue (3rd-4th batch) — gives time to revise
- Listen to every candidate's narration — note good points
- During chaos: stay silent, then speak with bold clear voice when energy drops
- Say: "As most of us perceived [theme]... without wasting time, the theme is [X] and actions can be [Y, Z]. Do we all agree?"
- For gender/age arguments: "Friends, we have time constraints. Let us assume age 20-25 and move on to actions."
- If nominated for common story: "WE as a GROUP have discussed..." — never "I think" or "my story"`;

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
