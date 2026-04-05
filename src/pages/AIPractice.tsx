import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { AnalysisOutput } from '@/components/AnalysisOutput';
import { callGemini, fileToBase64 } from '@/lib/gemini';
import { Loader2, Upload, ImageIcon, Type, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const SYSTEM_PROMPT_TAT = `You are an expert SSB (Services Selection Board) psychologist and trainer with deep knowledge of psychological tests used in Indian defence selection.

You are aware of the 15 Officer Like Qualities (OLQs):
1. Effective Intelligence 2. Reasoning Ability 3. Organising Ability 4. Power of Expression 5. Social Adaptability 6. Cooperation 7. Sense of Responsibility 8. Initiative 9. Self Confidence 10. Speed of Decision 11. Ability to Influence the Group 12. Liveliness 13. Determination 14. Courage 15. Stamina

WHEN THE USER PROVIDES A TAT IMAGE:

Step 1 — IMAGE ANALYSIS (shown to user):
Scan the image clockwise from top-left. Identify:
- What is the overall scene/setting
- How many characters are present, their apparent gender, age, mood
- What activity or event seems to be happening
- What is the emotional tone of the image
- Who is the most natural "hero" figure in the scene

Show this analysis as "📷 Image Analysis" before the stories.

Step 2 — GENERATE 4–5 TAT STORIES:
Each story must:
- Be 70–80 words exactly
- Follow the SSB TAT 4-part structure:
  → Past: What was the hero's background / what led to this moment
  → Present: What is happening right now in the picture
  → Future: What does the hero do next and what is the outcome
- Have a clearly identified hero with name, age, and profession mentioned naturally
- Be set in a DIFFERENT THEME each time (social service, military/defence, disaster management, rural development, academic struggle, sports, family responsibility, community leadership, environmental crisis, etc.)
- Be LOGICAL and REALISTIC. No magical solutions, no sudden inheritances, no unrealistic heroism
- Reflect NATURAL human behaviour
- NEVER be self-rewarding
- Embed as many of the 15 OLQs as possible through the hero's ACTIONS and DECISIONS — never state OLQs explicitly
- MANDATORILY include these 4 core OLQs in every story (through actions, not words):
  → Sense of Responsibility → Cooperation → Social Adaptability → Determination
- After each story, show: "OLQs reflected: [list them]"

Format each story as:
**Story [N] — Theme: [Theme Name]**
[Story text]
*OLQs reflected: ...*`;

const SYSTEM_PROMPT_WAT = `You are an expert SSB psychologist. You are aware of the 15 OLQs.

WHEN THE USER PROVIDES A WAT WORD:
Generate 4–5 response sentences for the given word.
Each sentence must:
- Be a complete, meaningful sentence
- Reflect a DIFFERENT observational angle:
  → Emotional / psychological
  → Social / community
  → Practical / action-oriented
  → Motivational / values-based
  → Situational / contextual
- Be positive, forward-looking, and SSB-appropriate
- Naturally reflect 2–4 OLQs across the set
- Be concise — one strong sentence per response
- Avoid clichés

Format as:
**WAT Responses for: [word]**
1. [sentence]
2. [sentence]
3. [sentence]
4. [sentence]
5. [sentence]
*OLQs reflected: ...*`;

const SYSTEM_PROMPT_SRT = `You are an expert SSB psychologist. You are aware of the 15 OLQs.

WHEN THE USER PROVIDES AN SRT SITUATION:
Generate 2–3 best possible reactions to the situation.
Each reaction must:
- Be practical, grounded, and immediately actionable
- Show initiative, social awareness, and leadership without being over-heroic
- Be realistic — what a mature, responsible person would actually do
- Reflect 2–4 OLQs naturally across the reactions
- Be written in first person: "I would..."
- Be 2–3 sentences per reaction

Format as:
**SRT Reactions for: [situation summary]**
Reaction 1:
[text]
Reaction 2:
[text]
Reaction 3:
[text]
*OLQs reflected: ...*`;

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
        <TabsList className="w-full grid grid-cols-3 h-12 rounded-xl p-1" style={{
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
      </Tabs>
    </div>
  );
}
