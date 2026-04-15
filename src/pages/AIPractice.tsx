import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { AnalysisOutput } from '@/components/AnalysisOutput';
import { callGemini, fileToBase64 } from '@/lib/gemini';
import { Loader2, Upload, ImageIcon, Pencil, Zap, Eye, EyeOff, Users, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  }
};

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
- Clear past to present to future flow
- 120-150 words per story

STEP 1 — DEEP IMAGE ANALYSIS (show before stories):
You MUST deeply analyze the picture before writing any story. Think like a detective:

A. BACKGROUND FIRST:
- What is the setting? Indoor/outdoor? Urban/rural/transport/institutional?
- Look for clues: windows, walls, furniture, vehicles, landscapes, boards, signs
- Example: If there are train windows/seats visible = train compartment. If there's a blackboard = classroom. If there's medical equipment = hospital.
- The background DEFINES what kind of story you can write. NEVER ignore it.

B. CHARACTER ANALYSIS:
- How many characters are visible? Male/Female?
- What are they WEARING? Clothing = profession clue. Lab coat = doctor. Uniform = military/police. Formal = office worker. Casual = student/traveller.
- What is each character's BODY LANGUAGE and FACIAL EXPRESSION?
- What are they DOING? Talking? Working? Looking worried? Helping someone?
- Who seems to be the most active/central character = potential hero

C. INTERACTION BETWEEN CHARACTERS:
- Are they talking to each other? Is one helping another?
- Is there tension, confusion, collaboration?
- What RELATIONSHIP could they have? Colleagues, strangers, family, teacher-student?

D. MOOD ASSESSMENT:
- NEVER label mood as "Negative" unless someone is clearly crying or in visible distress
- Stressed/worried/tense = "Neutral" NOT "Negative"
- Default to "Neutral" or "Positive"

E. LOGICAL DEDUCTION:
- Combine background + clothing + activity + expressions to form a LOGICAL scenario
- Example: Train background + man on phone looking stressed + woman looking confused = someone helping a first-time traveller, or informing family about delay, or coordinating something
- The story MUST emerge from what you SEE, not from random imagination

Display as:
Image Analysis: [3-4 lines describing what you see — background, characters, activity, mood, logical deduction of what could be happening]

Do NOT use emojis, stars, or special unicode characters anywhere in the output.

STEP 2 — GENERATE 4-5 TAT STORIES:

HERO RULES:
- HERO AGE SELECTION (CRITICAL — follow this priority):
  1. Look at ALL characters in the picture
  2. If ANY character appears to be 18-26 years old, MALE, and has a positive/neutral mood → HE is the hero. Always.
  3. If no male 18-26 is visible, check for a female 18-26 with positive/neutral mood → SHE is the hero.
  4. ONLY if NO character aged 18-26 exists in the picture, you may pick an older character as hero.
  5. NEVER make a 40+ year old uncle/senior the hero when a young 18-26 character is visible — this causes negative impact and story rejection.
  6. Hero age should be 18-26 in the story text, matching the young character visible.
- Give hero a simple Indian name matching the setting
- Mention age and profession naturally in the very first line
- ONLY the hero gets a name — NO other character gets a name or detailed introduction
- Other characters are referred to as: "his colleague", "a fellow passenger", "her friend", "the shopkeeper", "an elderly man", etc.
- Do NOT add characters not visible in the picture
- Hero's profession MUST match what is visible — clothing, setting, context. Do NOT contradict the picture.
- BACKGROUND MATTERS: If background shows a train, story must involve travel/journey. If background shows hospital, story involves health. Never ignore background.
- CRITICAL: ALL actions, decisions, and problem-solving MUST be done BY THE HERO. The hero drives the entire story. Other characters can be present but they do NOT take initiative, solve problems, or do the main work. If a female character is visible and you make the male character the hero, then the male must do everything — not the female. And vice versa. NEVER split the work between two characters. The hero is the doer, the leader, the one who acts. Everyone else is passive or supporting.

MANDATORY STORY STRUCTURE:
Past: Hero's background + what led to this moment (2-3 lines)
Present: What is happening right now — must match the picture (4-5 clear actions)
Future: What the hero does next + final outcome (2-3 lines)
Exception: If picture shows award/victory/celebration — write what led to it

STORY QUALITY RULES:
- 120-150 words per story — NOT shorter. Include 4-5 distinct actions in the present section.
- Logical, realistic, grounded — no magical or fantasy solutions
- No self-rewarding endings (getting award/medal/praise as climax = wrong)
- Never open with "One fine day"
- Story must align strictly with what is VISIBLE in the picture including background, clothing, and setting
- Every story must be on a DIFFERENT theme
- The story should feel NATURAL — like something that could actually happen in that setting

OLQ RULES:
The 15 OLQs are:
1. Effective Intelligence 2. Reasoning Ability 3. Organising Ability 4. Power of Expression 5. Social Adaptability 6. Cooperation 7. Sense of Responsibility 8. Initiative 9. Self Confidence 10. Speed of Decision 11. Ability to Influence the Group 12. Liveliness 13. Determination 14. Courage 15. Stamina

- Show OLQs ONLY through hero's actions and decisions — never state them
- Do NOT force all 15 OLQs into one story
- These 4 CORE OLQs are MANDATORY across stories:
  Sense of Responsibility, Cooperation, Social Adaptability, Determination

COMMON MISTAKES TO AVOID:
- Do not write a story that doesn't match the background/setting
- Do not name every character — ONLY the hero gets a name
- Do not introduce other characters with "his friend Rahul" — just say "his friend"
- Do not open with "One fine day"
- NEVER show hero as weak, under pressure, or seeking help — hero must be PROACTIVE
- Do NOT ignore background or clothing — they define the story context
- Do not write short 3-4 line stories — each story must be 120-150 words with 4-5 actions
- NEVER split work between hero and another character. If hero is Amit, then Amit does EVERYTHING. Do NOT make another character (named or unnamed) do the problem-solving, initiative-taking, or key actions. The hero is the SOLE driver of the story.

FORMATTING RULES:
- Do NOT use emojis, stars, or special unicode characters anywhere
- Do NOT use table format with | pipes — use plain text only
- Use clean plain text formatting only

OUTPUT FORMAT:
Story [N] — Theme: [Theme Name]
[Story text — 120-150 words with 4-5 actions]
OLQs reflected: [list]`;

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

STEP 1 — DEEP IMAGE ANALYSIS (show first):
You MUST deeply analyze the picture before writing any story. Think like a detective:

A. BACKGROUND FIRST:
- What is the setting? Indoor/outdoor? Urban/rural/transport/institutional?
- Look for clues: windows, walls, furniture, vehicles, landscapes, boards, signs
- Example: Train windows/seats = train. Blackboard = classroom. Medical equipment = hospital. Fields = rural area.
- The background DEFINES the story. NEVER ignore it.

B. CHARACTER ANALYSIS:
- How many characters are visible? Male/Female?
- What are they WEARING? Clothing = profession clue.
- Body language, facial expressions, what they are doing
- Who is the most active/central = potential hero

C. INTERACTION BETWEEN CHARACTERS:
- Are they talking, helping, arguing, working together?
- What relationship could they have?

D. MOOD ASSESSMENT:
- NEVER label mood as "Negative" unless someone is clearly crying or in visible distress
- Stressed/worried/tense = "Neutral" NOT "Negative"

E. LOGICAL DEDUCTION:
- Combine background + clothing + activity + expressions to form a LOGICAL scenario
- The story MUST emerge from what you SEE

Display as:
Picture Analysis:
Characters perceived: [X male, Y female]
Character 1 - Sex: Male, Age: [XX], Mood: [Positive/Neutral]
Character 2 - Sex: Female, Age: [XX], Mood: [Positive/Neutral]
(List each character on a separate line. Do NOT use table format.)

STEP 2 — DETERMINE THEME COUNT:
Based on the picture, determine how many DIFFERENT themes are realistically possible (usually 2-4).
Tell user: "Based on this picture, I can generate [N] different themes."

STEP 3 — GENERATE PPDT STORIES (one per theme):

HERO RULES:
- HERO AGE SELECTION (CRITICAL — follow this priority):
  1. Look at ALL characters in the picture
  2. If ANY character appears to be 18-26 years old, MALE, and has a positive/neutral mood → HE is the hero. Always.
  3. If no male 18-26 is visible, check for a female 18-26 with positive/neutral mood → SHE is the hero.
  4. ONLY if NO character aged 18-26 exists in the picture, you may pick an older character as hero.
  5. NEVER make a 40+ year old uncle/senior the hero when a young 18-26 character is visible — this causes negative impact and story rejection.
  6. Hero age should be 18-26 in the story text.
- SET NAME BASED ON PICTURE appearance (Sikh/Christian/South Indian/Hindu/Muslim)
- If NO human visible: IMAGINE a young 18-26 year old character based on the scene
- ONLY the hero gets a name — NO other character gets a name
- Other characters: "his colleague", "a fellow passenger", "her friend", "the elderly man", etc.
- Hero must be PROACTIVE — taking initiative, helping others
- Hero's profession MUST match clothing/context visible in the picture

MANDATORY STORY STRUCTURE (80-120 words per story):
1. Character Introduction: [Name], [age], [profession]. One line background.
2. Past (1-2 sentences): Why this situation arose. Keep SHORT — get to picture quickly.
3. Present (4-5 crisp actions): Hero DOING things. Must match what is visible in picture.
4. Future (1-2 sentences): Positive resolution.

CRITICAL RULES:
- BACKGROUND defines the story — train background = travel story, school = education, etc.
- CLOTHING defines hero's profession — do not contradict
- ONLY hero gets a name — everyone else is "his friend", "a passenger", etc.
- NEVER show hero as weak or needing help
- Realistic, logical, grounded
- Each theme must be genuinely different
- ALL actions and problem-solving MUST be done BY THE HERO. Never split work between hero and another character. The hero is the SOLE driver — everyone else is passive or supporting.

REFERENCE PPDT EXAMPLES (follow this style):
Example: "Sumit, a 23-year-old postgraduate student, noticed a crowd of villagers gathered around the Panchayat notice board in his hometown. Upon approaching, he realised that many were struggling to understand the complex eligibility criteria for a newly launched government skill-development scheme. Sensing their confusion, Sumit took the initiative to simplify the information. He spent the afternoon researching the scheme's details on his laptop and then returned to the board. He pinned up a handwritten, easy-to-read chart in the local language, outlining the necessary documents and the application deadline. He also organised a small briefing in the community hall to explain how the vocational training could lead to local employment. Sumit assisted ten youngsters in filling out their digital applications using his own data connection."

FORMATTING RULES:
- Do NOT use emojis, stars, or special unicode characters
- Do NOT use table format with | pipes — use plain text lists
- Use clean plain text formatting only

OUTPUT FORMAT FOR EACH STORY:

PPDT Story [N] — Theme: [Theme Name]

Characters: [X male, Y female] | Ages: [range] | Mood: [positive/neutral]

Story:
[Name], [age], [profession]. [Past — keep short]. [4-5 present actions]. [Future resolution].

Narration Script (ready-to-speak):
"Friends, from the picture shown to us, I have perceived [X male / X female] with age [XX-XX] years. [Male/Female] mood is [positive/neutral]. The action of my story is [one line theme summary]. My story goes like this —
[Character name], [age], [profession]. [What led to story]. [4-5 present actions]. [Future]. Thank you."

After all stories:
GD Tips:
- Stand in MIDDLE of queue (3rd-4th batch)
- Listen to every candidate's narration — note good points
- During chaos: stay silent, then speak with bold clear voice when energy drops
- Say: "As most of us perceived [theme]... without wasting time, the theme is [X] and actions can be [Y, Z]. Do we all agree?"
- For gender/age arguments: "Friends, we have time constraints. Let us assume age 20-25 and move on to actions."
- If nominated for common story: "WE as a GROUP have discussed..." — never "I think" or "my story"`;

import { usePracticeStore } from '@/store/practiceStore';

export default function AIPracticePage() {
  const {
    aiActiveTab: activeTab, setAiActiveTab: setActiveTab,
    tatImage, tatImageName, tatResult, setTatData,
    watWord, watResult, setWatData,
    srtSituation, srtResult, setSrtData,
    ppdtImage, ppdtImageName, ppdtResult, setPpdtData
  } = usePracticeStore();

  const [watUserSentence, setWatUserSentence] = useState('');
  const [srtUserResponse, setSrtUserResponse] = useState('');
  const [tatUserStory, setTatUserStory] = useState('');
  const [ppdtUserStory, setPpdtUserStory] = useState('');
  const [practiceMode, setPracticeMode] = useState<'MODEL' | 'SELF'>('MODEL');

  const [showOlqTags, setShowOlqTags] = useState(true);
  const [tatLoading, setTatLoading] = useState(false);
  const [watLoading, setWatLoading] = useState(false);
  const [srtLoading, setSrtLoading] = useState(false);
  const [ppdtLoading, setPpdtLoading] = useState(false);

  const handleClearTat = () => { setTatData({ result: '', image: null, name: '' }); if (document.getElementById('tat-upload')) (document.getElementById('tat-upload') as HTMLInputElement).value = ''; };
  const handleClearWat = () => { setWatData({ result: '', word: '' }); setWatUserSentence(''); };
  const handleClearSrt = () => { setSrtData({ result: '', situation: '' }); setSrtUserResponse(''); };
  const handleClearPpdt = () => { setPpdtData({ result: '', image: null, name: '' }); if (document.getElementById('ppdt-upload')) (document.getElementById('ppdt-upload') as HTMLInputElement).value = ''; };

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
    setTatData({ image: base64, name: file.name });
  };

  const analyzeTat = async () => {
    if (!tatImage) {
      toast.error('Please upload a TAT image first');
      return;
    }
    setTatLoading(true);
    setTatData({ result: '' });
    try {
      let prompt = '';
      if (practiceMode === 'SELF' && tatUserStory.trim()) {
        prompt = `You are an SSB psychologist.
Examine this TAT picture and the Candidate's Story below.
Candidate's Story: "${tatUserStory}"
Analyze if this story follows the recommended guidelines (Hero age 18-26, proactive action, Past/Present/Future structure, positive outcomes, OLQs).
Provide an improved SSB-style story.`;
      } else {
        prompt = SYSTEM_PROMPT_TAT + '\n\nAnalyze this TAT image and generate stories as instructed.';
      }
      const result = await callGemini(prompt, tatImage);
      setTatData({ result: result });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
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
    setWatData({ result: '' });
    try {
      let prompt = '';
      if (practiceMode === 'SELF' && watUserSentence.trim()) {
        prompt = `You are an SSB psychologist.
Word: "${trimmed}"
Candidate's Sentence: "${watUserSentence}"
Analyze if this sentence follows the manual guidelines (Observational, no third person, positive actions, short, reflects OLQs). 
Then provide a model improved version.`;
      } else {
        prompt = SYSTEM_PROMPT_WAT + `\n\nThe word is: "${trimmed}"\n\nGenerate WAT responses as instructed.`;
      }
      const result = await callGemini(prompt);
      setWatData({ result: result.replace(/\*/g, '') });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
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
    setSrtData({ result: '' });
    try {
      let prompt = '';
      if (practiceMode === 'SELF' && srtUserResponse.trim()) {
        prompt = `You are an SSB psychologist.
Situation: "${trimmed}"
Candidate's Response: "${srtUserResponse}"
Analyze this response (Realism, logic, complete resolution, telegram style, OLQs).
Provide an improved short-form action sequence.`;
      } else {
        prompt = SYSTEM_PROMPT_SRT + `\n\nThe situation is: "${trimmed}"\n\nGenerate SRT reactions as instructed.`;
      }
      const result = await callGemini(prompt);
      setSrtData({ result: result.replace(/\*/g, '') });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
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
    setPpdtData({ image: base64, name: file.name });
  };

  const analyzePpdt = async () => {
    if (!ppdtImage) {
      toast.error('Please upload a PPDT image first');
      return;
    }
    setPpdtLoading(true);
    setPpdtData({ result: '' });
    try {
      let prompt = '';
      if (practiceMode === 'SELF' && ppdtUserStory.trim()) {
        prompt = `You are an SSB psychologist.
Examine this PPDT picture and the Candidate's Narration below.
Candidate's Narration: "${ppdtUserStory}"
Analyze the narration quality (Clarity, confidence, theme selection, group goal focus).
Provide a model narration script.`;
      } else {
        prompt = SYSTEM_PROMPT_PPDT + '\n\nAnalyze this PPDT image. Identify all characters (Age, Sex, Mood), generate a complete PPDT story with narration script, and provide GD tips.';
      }
      const result = await callGemini(prompt, ppdtImage);
      setPpdtData({ result: result });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setPpdtLoading(false);
    }
  };

  const filterOlqTags = (text: string) => {
    if (showOlqTags) return text;
    return text.replace(/\*OLQs reflected:.*?\*/g, '').replace(/OLQs reflected:.*$/gm, '');
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 scroll-reveal"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="glass-card glow-gold relative overflow-hidden">
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
      </motion.div>

      {/* Mode & OLQ Toggle */}
      <motion.div variants={itemVariants} className="flex justify-between items-center gap-4">
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setPracticeMode('MODEL')}
            className={`px-4 py-1.5 rounded-lg text-xs font-heading font-bold transition-all ${practiceMode === 'MODEL' ? 'bg-gold text-black' : 'text-muted-foreground'}`}
          >
            Model Answers
          </button>
          <button
            onClick={() => setPracticeMode('SELF')}
            className={`px-4 py-1.5 rounded-lg text-xs font-heading font-bold transition-all ${practiceMode === 'SELF' ? 'bg-gold text-black' : 'text-muted-foreground'}`}
          >
            Analyze My Work
          </button>
        </div>
        <button
          onClick={() => setShowOlqTags(!showOlqTags)}
          className="glass-button flex items-center gap-2 text-xs"
        >
          {showOlqTags ? 'Hide' : 'Show'} OLQ Tags
        </button>
      </motion.div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <motion.div variants={containerVariants}>
          <TabsList className="w-full grid grid-cols-4 h-12 rounded-xl p-1" style={{
            background: 'linear-gradient(135deg, hsl(var(--card) / 0.8), hsl(var(--card) / 0.5))',
            backdropFilter: 'blur(16px)',
            border: '1px solid hsl(var(--border) / 0.3)',
          }}>
            <TabsTrigger value="tat" className="rounded-lg font-heading font-semibold text-sm data-[state=active]:bg-[hsl(var(--gold)/0.15)] data-[state=active]:text-gold data-[state=active]:shadow-none">
              <ImageIcon className="h-4 w-4 mr-1.5" /> TAT
            </TabsTrigger>
            <TabsTrigger value="wat" className="rounded-lg font-heading font-semibold text-sm data-[state=active]:bg-[hsl(var(--gold)/0.15)] data-[state=active]:text-gold data-[state=active]:shadow-none">
              <Pencil className="h-4 w-4 mr-1.5" /> WAT
            </TabsTrigger>
            <TabsTrigger value="srt" className="rounded-lg font-heading font-semibold text-sm data-[state=active]:bg-[hsl(var(--gold)/0.15)] data-[state=active]:text-gold data-[state=active]:shadow-none">
              <Zap className="h-4 w-4 mr-1.5" /> SRT
            </TabsTrigger>
            <TabsTrigger value="ppdt" className="rounded-lg font-heading font-semibold text-sm data-[state=active]:bg-[hsl(var(--gold)/0.15)] data-[state=active]:text-gold data-[state=active]:shadow-none">
              <Users className="h-4 w-4 mr-1.5" /> PPDT
            </TabsTrigger>
          </TabsList>
        </motion.div>

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

              {practiceMode === 'SELF' && (
                <Textarea
                  placeholder="Type your TAT story here to get it analyzed..."
                  value={tatUserStory}
                  onChange={(e) => setTatUserStory(e.target.value)}
                  className="min-h-[150px] bg-background/30 border-gold/20 italic"
                />
              )}

              <button
                onClick={analyzeTat}
                disabled={tatLoading || !tatImage || (practiceMode === 'SELF' && !tatUserStory.trim())}
                className="glass-button-gold w-full flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {tatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {practiceMode === 'SELF' ? 'Analyze My Story' : 'Generate Model STORIES'}
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
                onChange={(e) => setWatData({ word: e.target.value })}
                className="h-12 text-base font-body bg-background/50 border-border/40 focus:border-gold/50"
              />
              {practiceMode === 'SELF' && (
                <Textarea
                  placeholder="Type your own sentence here to get it analyzed..."
                  value={watUserSentence}
                  onChange={(e) => setWatUserSentence(e.target.value)}
                  className="min-h-[80px] bg-background/30 border-gold/20 italic"
                />
              )}
              
              <div className="flex gap-2">
                <button
                  onClick={analyzeWat}
                  disabled={watLoading || !watWord.trim() || (practiceMode === 'SELF' && !watUserSentence.trim())}
                  className="glass-button-gold flex-1 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {watLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {practiceMode === 'SELF' ? 'Analyze My Sentence' : 'Generate Model Responses'}
                </button>
                {watResult && (
                  <button onClick={handleClearWat} className="glass-button px-4 border-destructive/30 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
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
                onChange={(e) => setSrtData({ situation: e.target.value })}
                className="min-h-[120px] text-sm font-body bg-background/50 border-border/40 focus:border-gold/50"
              />
              {practiceMode === 'SELF' && (
                <Textarea
                  placeholder="Type your own response here to get it analyzed..."
                  value={srtUserResponse}
                  onChange={(e) => setSrtUserResponse(e.target.value)}
                  className="min-h-[100px] bg-background/30 border-gold/20 italic"
                />
              )}

              <div className="flex gap-2">
                <button
                  onClick={analyzeSrt}
                  disabled={srtLoading || !srtSituation.trim() || (practiceMode === 'SELF' && !srtUserResponse.trim())}
                  className="glass-button-gold flex-1 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                >
                  {srtLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {practiceMode === 'SELF' ? 'Analyze My Response' : 'Generate Model Reactions'}
                </button>
                {srtResult && (
                  <button onClick={handleClearSrt} className="glass-button px-4 border-destructive/30 text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
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

              {/* No secondary label needed here, removing the accidental closing tag */}

              {practiceMode === 'SELF' && (
                <Textarea
                  placeholder="Type your PPDT narration here to get it analyzed..."
                  value={ppdtUserStory}
                  onChange={(e) => setPpdtUserStory(e.target.value)}
                  className="min-h-[150px] bg-background/30 border-gold/20 italic"
                />
              )}

              <button
                onClick={analyzePpdt}
                disabled={ppdtLoading || !ppdtImage || (practiceMode === 'SELF' && !ppdtUserStory.trim())}
                className="glass-button-gold w-full flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {ppdtLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {practiceMode === 'SELF' ? 'Analyze My Narration' : 'Generate Model Narration'}
              </button>
            </div>
          </div>

          {ppdtResult && <AnalysisOutput content={ppdtResult} title="AI-Generated PPDT Story & Narration" />}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
