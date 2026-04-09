import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { AnalysisOutput } from '@/components/AnalysisOutput';
import { callGemini, fileToBase64 } from '@/lib/gemini';
import { Loader2, Upload, MessageSquare, Mic, Users, Sword, Clock, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

import gtoTask1 from '@/assets/gto/gto-task-1.jpg';
import gtoTask2 from '@/assets/gto/gto-task-2.jpg';
import gtoTask3 from '@/assets/gto/gto-task-3.jpg';

const GTO_IMAGES = [gtoTask1, gtoTask2, gtoTask3];

const SYSTEM_PROMPT_GD = `You are an SSB GTO (Group Testing Officer) expert specializing in Group Discussion practice for Indian defence selection.

The user will give you a GD topic. You must provide CURRENT, UP-TO-DATE talking points that the candidate can use in the GD.

RULES:
1. Points must be CURRENT — use latest facts, data, events (2024-2026). No outdated 10-year-old data.
2. Provide 8-10 strong talking points covering BOTH sides (For & Against)
3. Each point should be 2-3 lines — crisp, factual, quotable
4. Include relevant statistics, recent events, government policies, or global context
5. Add 2-3 strong opening lines the candidate can use to start the GD
6. Add 2-3 closing/summary lines
7. Suggest which SIDE to take (and why) for an SSB candidate — officer-like thinking
8. Include 2-3 counter-argument strategies
9. Keep tone confident, balanced, and mature — not emotional or one-sided

OUTPUT FORMAT:
GD Points for: [TOPIC]

Opening Lines (pick one):
1. [opening line]
2. [opening line]
3. [opening line]

Points FOR:
1. [point with current facts]
2. [point]
3. [point]
4. [point]

Points AGAINST:
1. [point with current facts]
2. [point]
3. [point]
4. [point]

Recommended Stand: [which side + reasoning for SSB context]

Counter-Argument Strategies:
1. [strategy]
2. [strategy]

Closing Lines:
1. [closing]
2. [closing]

GD Tips for SSB:
- Enter discussion within first 2-3 speakers — don't wait too long
- Use "Building on what chest number X said..." to show cooperation
- Never interrupt — wait for a pause, then speak with authority
- Quality > Quantity — 3-4 strong entries are better than 10 weak ones
- Summarize at the end if possible — shows organizing ability`;

const SYSTEM_PROMPT_GPE = `You are an SSB GTO expert specializing in GPE (Group Planning Exercise) for Indian defence selection.

The user will upload a GPE map/image and describe the problem paragraph. You must provide a complete GPE solution.

RULES:
1. Analyze the map carefully — note rivers, bridges, roads, villages, obstacles, distances
2. Provide a PRACTICAL step-by-step solution
3. Prioritize problems by urgency (life-threatening first, then property, then routine)
4. Time management is critical — total time available is usually 20-30 minutes in the scenario
5. Use available resources wisely (people, vehicles, equipment mentioned in the paragraph)
6. Show cooperation — involve group members
7. Solution should be REALISTIC — no superhero actions
8. Address ALL problems mentioned, not just the main one

OUTPUT FORMAT:
GPE Solution for: [Brief situation summary]

Problems Identified (priority order):
1. [Most urgent — life/safety]
2. [Second priority]
3. [Third priority]
...

Available Resources:
- [List resources from the scenario]

Step-by-Step Action Plan:
Time 0-5 min: [immediate actions]
Time 5-10 min: [next actions]
Time 10-15 min: [continuation]
Time 15-20 min: [completion/follow-up]

Division of Labour:
- You (leader): [your actions]
- Group members: [delegated tasks]

Alternative Plan (if primary fails):
[Brief backup plan]

OLQs demonstrated: [list relevant OLQs]

If the user also submits their own solution, analyze it:
- What they did well
- What they missed
- Specific improvements
- Score out of 10`;

const SYSTEM_PROMPT_LECTURETTE = `You are an SSB GTO expert specializing in Lecturette practice for Indian defence selection.

A Lecturette is a 3-minute individual speech on a given topic. The candidate picks one topic from 4 options and speaks for exactly 3 minutes.

WHEN USER GIVES A TOPIC — GENERATE A MODEL LECTURETTE:

FORMAT TO FOLLOW:
1. Opening: "Jay Hind everyone. [Relevant quote about the topic]. With this, I will be starting my lecturette on [TOPIC]."
2. Structure declaration: "I have divided my lecturette into [N] parts: [Part 1], [Part 2], [Part 3], and most importantly, my personal opinion."
3. Body: Each part with CURRENT facts, statistics, recent events (2024-2026 data — NOT outdated)
4. Personal Opinion: "In my personal opinion..." — show mature, balanced, officer-like thinking
5. Closing: Strong concluding line + "Thank you. Jay Hind."

RULES:
1. EXACTLY 3 minutes when spoken — approximately 400-450 words
2. Use CURRENT data — recent policies, events, statistics. No 10-year-old facts.
3. Include at least 2-3 specific facts/numbers/dates
4. Structure must be clear — listener should follow easily
5. Language should be formal but natural — not robotic
6. Show awareness of Indian and global context
7. Personal opinion must be balanced and mature
8. Quote at the start must be RELEVANT to the topic

OUTPUT FORMAT:
Model Lecturette on: [TOPIC]
Duration: ~3 minutes | Word Count: ~400-450

---
[Full lecturette text]
---

Structure Breakdown:
- Opening quote + topic declaration
- Part 1: [name] (X words)
- Part 2: [name] (X words)
- Part 3: [name] (X words)
- Personal opinion
- Closing

Key Facts Used:
1. [fact/statistic]
2. [fact/statistic]
3. [fact/statistic]

Tips:
- Maintain eye contact with the audience
- Speak at moderate pace — not too fast
- Use hand gestures naturally
- If you forget a point, smoothly transition to the next part
- End exactly at 3 minutes — practice with a timer

If the user submits their OWN lecturette for review, analyze:
- Structure check (opening/body/closing)
- Current facts used?
- Word count (target 400-450)
- Flow and clarity
- Improvements needed
- Score out of 10`;

const SNAKE_RACE_TIPS = `## Snake Race / Group Obstacles — Key Tips

**What is Snake Race:**
The group (8-10 candidates) must cross a series of obstacles while carrying a heavy snake-like structure (wooden log/pole). Everyone must stay connected. It tests teamwork, stamina, and group coordination.

**Rules:**
- All group members must cross each obstacle
- The snake (log) must be carried throughout
- No one can touch the ground between obstacles (in some setups)
- Time limit applies — usually 15-20 minutes for all obstacles

**Tips for Scoring Well:**

**Physical Preparation:**
- Build upper body strength — pull-ups, push-ups, rope climbing
- Practice carrying heavy objects while running
- Improve grip strength — you'll be holding the log for 15+ minutes
- Stamina is key — practice running with weight

**During the Task:**
- Volunteer to carry the heavier end of the snake
- Always help the weakest member cross obstacles — GTO watches this closely
- Call out encouragement: "Come on team!", "We can do this!"
- If someone falls behind, slow down for them — NEVER leave anyone behind
- Suggest efficient crossing strategies at each obstacle
- Take front or back position — both are challenging and show initiative

**OLQs Tested:**
- Cooperation — helping others cross
- Stamina — physical endurance
- Initiative — volunteering for tough positions
- Determination — pushing through fatigue
- Ability to Influence Group — motivating others
- Courage — attempting difficult obstacles first

**Common Mistakes:**
- Focusing only on your own crossing — GTO watches group behaviour
- Getting frustrated with slow members — show patience
- Not communicating — always talk to your group
- Trying to rush — steady pace beats speed
- Giving up when tired — push through

**Practice Routine (2 weeks before SSB):**
- Daily: 50 push-ups, 20 pull-ups, 2km run with 5kg backpack
- Practice climbing walls, jumping over barriers
- Work on grip strength with dead hangs (3 sets of 30 seconds)
- Practice team coordination games`;

export default function GTOPage() {
  const [activeTab, setActiveTab] = useState('gd');
  const [currentImage, setCurrentImage] = useState(0);

  // GD state
  const [gdTopic, setGdTopic] = useState('');
  const [gdResult, setGdResult] = useState('');
  const [gdLoading, setGdLoading] = useState(false);

  // GPE state
  const [gpeImage, setGpeImage] = useState<string | null>(null);
  const [gpeImageName, setGpeImageName] = useState('');
  const [gpeParagraph, setGpeParagraph] = useState('');
  const [gpeResult, setGpeResult] = useState('');
  const [gpeLoading, setGpeLoading] = useState(false);
  const [gpeUserSolution, setGpeUserSolution] = useState('');
  const [gpeUserAnalysis, setGpeUserAnalysis] = useState('');
  const [gpeUserLoading, setGpeUserLoading] = useState(false);

  // Lecturette state
  const [lecTopic, setLecTopic] = useState('');
  const [lecResult, setLecResult] = useState('');
  const [lecLoading, setLecLoading] = useState(false);
  const [lecUserText, setLecUserText] = useState('');
  const [lecUserAnalysis, setLecUserAnalysis] = useState('');
  const [lecUserLoading, setLecUserLoading] = useState(false);

  // Image slideshow
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % GTO_IMAGES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // GD handler
  const analyzeGd = async () => {
    const trimmed = gdTopic.trim();
    if (!trimmed) { toast.error('Please enter a GD topic'); return; }
    setGdLoading(true);
    setGdResult('');
    try {
      const result = await callGemini(
        SYSTEM_PROMPT_GD + `\n\nThe GD topic is: "${trimmed}"\n\nGenerate current talking points as instructed.`
      );
      setGdResult(result);
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate GD points');
    } finally {
      setGdLoading(false);
    }
  };

  // GPE handlers
  const handleGpeImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('Image must be under 10MB'); return; }
    const base64 = await fileToBase64(file);
    setGpeImage(base64);
    setGpeImageName(file.name);
  };

  const analyzeGpe = async () => {
    if (!gpeImage) { toast.error('Please upload a GPE map image'); return; }
    if (!gpeParagraph.trim()) { toast.error('Please enter the problem paragraph'); return; }
    setGpeLoading(true);
    setGpeResult('');
    try {
      const result = await callGemini(
        SYSTEM_PROMPT_GPE + `\n\nThe GPE problem paragraph is:\n"${gpeParagraph.trim()}"\n\nAnalyze the map image and provide a complete GPE solution.`,
        gpeImage
      );
      setGpeResult(result);
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate GPE solution');
    } finally {
      setGpeLoading(false);
    }
  };

  const analyzeGpeUserSolution = async () => {
    if (!gpeUserSolution.trim()) { toast.error('Please enter your solution'); return; }
    setGpeUserLoading(true);
    setGpeUserAnalysis('');
    try {
      const result = await callGemini(
        SYSTEM_PROMPT_GPE + `\n\nThe GPE problem paragraph is:\n"${gpeParagraph.trim()}"\n\nThe candidate's own solution is:\n"${gpeUserSolution.trim()}"\n\nAnalyze their solution — what they did well, what they missed, specific improvements, and score out of 10.`,
        gpeImage || undefined
      );
      setGpeUserAnalysis(result);
    } catch (err: any) {
      toast.error(err.message || 'Failed to analyze your solution');
    } finally {
      setGpeUserLoading(false);
    }
  };

  // Lecturette handlers
  const analyzeLec = async () => {
    const trimmed = lecTopic.trim();
    if (!trimmed) { toast.error('Please enter a lecturette topic'); return; }
    setLecLoading(true);
    setLecResult('');
    try {
      const result = await callGemini(
        SYSTEM_PROMPT_LECTURETTE + `\n\nThe lecturette topic is: "${trimmed}"\n\nGenerate a complete 3-minute model lecturette as instructed.`
      );
      setLecResult(result);
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate lecturette');
    } finally {
      setLecLoading(false);
    }
  };

  const analyzeLecUser = async () => {
    if (!lecUserText.trim()) { toast.error('Please enter your lecturette'); return; }
    setLecUserLoading(true);
    setLecUserAnalysis('');
    try {
      const result = await callGemini(
        SYSTEM_PROMPT_LECTURETTE + `\n\nThe topic is: "${lecTopic.trim()}"\n\nThe candidate's own lecturette is:\n"${lecUserText.trim()}"\n\nAnalyze their lecturette — structure, current facts, word count, flow, clarity, improvements needed, and score out of 10.`
      );
      setLecUserAnalysis(result);
    } catch (err: any) {
      toast.error(err.message || 'Failed to analyze lecturette');
    } finally {
      setLecUserLoading(false);
    }
  };

  return (
    <div className="space-y-6 scroll-reveal">
      {/* Header with GTO images */}
      <div className="glass-card glow-gold relative overflow-hidden">
        {/* Background slideshow */}
        {GTO_IMAGES.map((src, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-[2000ms] ease-in-out"
            style={{
              opacity: currentImage === i ? 0.12 : 0,
              backgroundImage: `url(${src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        ))}
        <div className="relative z-10">
          <h1 className="text-2xl md:text-3xl font-heading font-bold mb-2">
            <span className="shimmer-text">GTO Tasks</span>
          </h1>
          <p className="text-muted-foreground font-body text-sm max-w-2xl leading-relaxed">
            Practice Group Discussion, Group Planning Exercise, Lecturette, and more — with AI-powered feedback and current facts.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-4 h-12 rounded-xl p-1" style={{
          background: 'linear-gradient(135deg, hsl(var(--card) / 0.8), hsl(var(--card) / 0.5))',
          backdropFilter: 'blur(16px)',
          border: '1px solid hsl(var(--border) / 0.3)',
        }}>
          <TabsTrigger value="gd" className="rounded-lg font-heading font-semibold text-xs sm:text-sm data-[state=active]:bg-[hsl(var(--gold)/0.15)] data-[state=active]:text-gold data-[state=active]:shadow-none">
            <MessageSquare className="h-4 w-4 mr-1" /> GD
          </TabsTrigger>
          <TabsTrigger value="gpe" className="rounded-lg font-heading font-semibold text-xs sm:text-sm data-[state=active]:bg-[hsl(var(--gold)/0.15)] data-[state=active]:text-gold data-[state=active]:shadow-none">
            <Users className="h-4 w-4 mr-1" /> GPE
          </TabsTrigger>
          <TabsTrigger value="lecturette" className="rounded-lg font-heading font-semibold text-xs sm:text-sm data-[state=active]:bg-[hsl(var(--gold)/0.15)] data-[state=active]:text-gold data-[state=active]:shadow-none">
            <Mic className="h-4 w-4 mr-1" /> Lec
          </TabsTrigger>
          <TabsTrigger value="more" className="rounded-lg font-heading font-semibold text-xs sm:text-sm data-[state=active]:bg-[hsl(var(--gold)/0.15)] data-[state=active]:text-gold data-[state=active]:shadow-none">
            <Sword className="h-4 w-4 mr-1" /> More
          </TabsTrigger>
        </TabsList>

        {/* GD Tab */}
        <TabsContent value="gd" className="mt-6 space-y-4">
          <div className="glass-card">
            <h3 className="font-heading font-bold text-base text-gold gold-border-left mb-4">Enter GD Topic</h3>
            <div className="space-y-4">
              <Input
                placeholder="Enter a GD topic (e.g., Iran vs US, AI in Defence, One Nation One Election...)"
                value={gdTopic}
                onChange={(e) => setGdTopic(e.target.value)}
                className="h-12 text-base font-body bg-background/50 border-border/40 focus:border-gold/50"
                onKeyDown={(e) => e.key === 'Enter' && analyzeGd()}
              />
              <button
                onClick={analyzeGd}
                disabled={gdLoading || !gdTopic.trim()}
                className="glass-button-gold w-full flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {gdLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
                {gdLoading ? 'Generating Current Points...' : 'Generate GD Points'}
              </button>
            </div>
          </div>
          {gdResult && <AnalysisOutput content={gdResult} title="AI-Generated GD Points" />}
        </TabsContent>

        {/* GPE Tab */}
        <TabsContent value="gpe" className="mt-6 space-y-4">
          <div className="glass-card">
            <h3 className="font-heading font-bold text-base text-gold gold-border-left mb-4">Upload GPE Map & Problem</h3>
            <div className="space-y-4">
              <label className="glass-card-subtle flex flex-col items-center justify-center py-6 cursor-pointer hover:border-gold/40 transition-colors border-2 border-dashed border-border/40 rounded-xl">
                <input type="file" accept="image/*" className="hidden" onChange={handleGpeImageUpload} />
                {gpeImage ? (
                  <div className="space-y-3 text-center">
                    <img src={gpeImage} alt="GPE Map" className="max-h-48 rounded-lg mx-auto shadow-lg" />
                    <p className="text-sm text-muted-foreground font-body">{gpeImageName}</p>
                    <p className="text-xs text-gold">Click to change image</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-muted-foreground/40 mb-2" />
                    <p className="text-sm text-muted-foreground font-body">Upload GPE map/picture</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">JPG, PNG — max 10MB</p>
                  </>
                )}
              </label>

              <Textarea
                placeholder="Paste the GPE problem paragraph here (the scenario description with problems, resources, and time constraints)..."
                value={gpeParagraph}
                onChange={(e) => setGpeParagraph(e.target.value)}
                className="min-h-[100px] text-sm font-body bg-background/50 border-border/40 focus:border-gold/50"
              />

              <button
                onClick={analyzeGpe}
                disabled={gpeLoading || !gpeImage || !gpeParagraph.trim()}
                className="glass-button-gold w-full flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {gpeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
                {gpeLoading ? 'Generating GPE Solution...' : 'Get AI GPE Solution'}
              </button>
            </div>
          </div>

          {gpeResult && <AnalysisOutput content={gpeResult} title="AI-Generated GPE Solution" />}

          {/* User's own solution analysis */}
          {gpeResult && (
            <div className="glass-card">
              <h3 className="font-heading font-bold text-base text-gold gold-border-left mb-4">Submit Your Solution for Review</h3>
              <div className="space-y-4">
                <Textarea
                  placeholder="Paste your own GPE solution here — AI will analyze and give improvements..."
                  value={gpeUserSolution}
                  onChange={(e) => setGpeUserSolution(e.target.value)}
                  className="min-h-[100px] text-sm font-body bg-background/50 border-border/40 focus:border-gold/50"
                />
                <button
                  onClick={analyzeGpeUserSolution}
                  disabled={gpeUserLoading || !gpeUserSolution.trim()}
                  className="glass-button-gold w-full flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {gpeUserLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                  {gpeUserLoading ? 'Analyzing Your Solution...' : 'Analyze My Solution'}
                </button>
              </div>
            </div>
          )}

          {gpeUserAnalysis && <AnalysisOutput content={gpeUserAnalysis} title="Your GPE Solution — AI Review" />}
        </TabsContent>

        {/* Lecturette Tab */}
        <TabsContent value="lecturette" className="mt-6 space-y-4">
          <div className="glass-card">
            <h3 className="font-heading font-bold text-base text-gold gold-border-left mb-4">Enter Lecturette Topic</h3>
            <div className="space-y-4">
              <Input
                placeholder="Enter a topic (e.g., Digital India, Climate Change, Women in Armed Forces...)"
                value={lecTopic}
                onChange={(e) => setLecTopic(e.target.value)}
                className="h-12 text-base font-body bg-background/50 border-border/40 focus:border-gold/50"
                onKeyDown={(e) => e.key === 'Enter' && analyzeLec()}
              />
              <button
                onClick={analyzeLec}
                disabled={lecLoading || !lecTopic.trim()}
                className="glass-button-gold w-full flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {lecLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}
                {lecLoading ? 'Generating Lecturette...' : 'Generate Model Lecturette'}
              </button>
            </div>
          </div>

          {lecResult && <AnalysisOutput content={lecResult} title="AI-Generated Model Lecturette" />}

          {/* User lecturette analysis */}
          {lecResult && (
            <div className="glass-card">
              <h3 className="font-heading font-bold text-base text-gold gold-border-left mb-4">Submit Your Lecturette for Review</h3>
              <div className="space-y-4">
                <Textarea
                  placeholder="Paste your own lecturette text here — AI will analyze structure, facts, and flow..."
                  value={lecUserText}
                  onChange={(e) => setLecUserText(e.target.value)}
                  className="min-h-[120px] text-sm font-body bg-background/50 border-border/40 focus:border-gold/50"
                />
                <button
                  onClick={analyzeLecUser}
                  disabled={lecUserLoading || !lecUserText.trim()}
                  className="glass-button-gold w-full flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {lecUserLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                  {lecUserLoading ? 'Analyzing Your Lecturette...' : 'Analyze My Lecturette'}
                </button>
              </div>
            </div>
          )}

          {lecUserAnalysis && <AnalysisOutput content={lecUserAnalysis} title="Your Lecturette — AI Review" />}
        </TabsContent>

        {/* More Tab — Snake Race + Coming Soon */}
        <TabsContent value="more" className="mt-6 space-y-4">
          {/* Snake Race Tips */}
          <div className="glass-card">
            <h3 className="font-heading font-bold text-base text-gold gold-border-left mb-4">Snake Race / Group Obstacles</h3>
            <AnalysisOutput content={SNAKE_RACE_TIPS} title="Snake Race Tips & Strategy" />
          </div>

          {/* Coming Soon */}
          <div className="glass-card text-center py-8">
            <Clock className="h-10 w-10 text-gold/40 mx-auto mb-4" />
            <h3 className="font-heading font-bold text-lg text-foreground mb-2">More GTO Tasks — Coming Soon</h3>
            <p className="font-body text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              PGT (Progressive Group Task), HGT (Half Group Task), Individual Obstacles, Command Task, and Final Group Task practice modules are being built.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {['PGT', 'HGT', 'Individual Obstacles', 'Command Task', 'FGT'].map((task) => (
                <span key={task} className="px-3 py-1.5 rounded-full text-xs font-heading font-semibold border border-border/40 text-muted-foreground" style={{
                  background: 'hsl(var(--muted) / 0.3)',
                }}>
                  {task}
                </span>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
