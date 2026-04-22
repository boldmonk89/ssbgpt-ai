import { useState } from 'react';
import { callGeminiMultiPart, fileToBase64 } from '@/lib/gemini';
import { LoadingCard } from '@/components/LoadingCard';
import { AnalysisOutput } from '@/components/AnalysisOutput';
import { useHistorySave } from '@/hooks/useHistorySave';
import { ImageIcon, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const PPDT_PROMPT = `You are an SSB (Services Selection Board) PPDT (Picture Perception & Description Test) expert assistant.

STEP 1 — DEEP IMAGE ANALYSIS (show first):
You MUST deeply analyze the picture before writing any story. Think like a detective:

A. BACKGROUND FIRST:
- What is the setting? Indoor/outdoor? Urban/rural/transport/institutional?
- Look for clues: windows, walls, furniture, vehicles, landscapes, boards, signs
- The background DEFINES the story. NEVER ignore it.
- SSB PPDT images are intentionally hazy/blurry. Acknowledge this ambiguity but still analyze what is visible.

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
Based on the picture, determine how many DIFFERENT themes are realistically possible without losing the stimulus.
Tell user: "Based on this picture, I can generate [N] different themes."

STEP 3 — GENERATE PPDT STORIES (one per theme):

HERO RULES:
- HERO AGE SELECTION (CRITICAL):
  1. If ANY character appears to be 18-26 years old, MALE, and has a positive/neutral mood, HE is the hero.
  2. If no male 18-26 is visible, check for a female 18-26 with positive/neutral mood, SHE is the hero.
  3. ONLY if NO character aged 18-26 exists, you may pick an older character as hero.
  4. NEVER make a 40+ year old the hero when a young 18-26 character is visible.
- SET NAME BASED ON PICTURE appearance (Sikh/Christian/South Indian/Hindu/Muslim)
- ONLY the hero gets a name. NO other character gets a name.
- Other characters: "his colleague", "a fellow passenger", "her friend", "the elderly man", etc.
- Hero must be PROACTIVE — taking initiative, helping others.

MANDATORY STORY STRUCTURE (80-120 words per story):
1. Character Introduction: [Name], [age], [profession]. One line background.
2. Past (1-2 sentences): Why this situation arose. Keep SHORT.
3. Present (4-5 crisp actions): Hero DOING things. Must match what is visible in picture.
4. Future (1-2 sentences): Positive resolution.

STAR Formula: Situation, Thought, Action, Result, Positive Ending.
Team Player Rules: Praise the team, show collective effort. No individual heroism only.
Never give rewards to yourself (medals/awards/self-glory).

OUTPUT FORMAT FOR EACH STORY:

PPDT Story [N] — Theme: [Theme Name]

Characters: [X male, Y female] | Ages: [range] | Mood: [positive/neutral]

Story:
[Name], [age], [profession]. [Past]. [4-5 present actions]. [Future resolution].

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
- If nominated for common story: "WE as a GROUP have discussed..." — never "I think" or "my story"

CRITICAL FORMATTING:
- Do NOT use emojis, stars (*), or special unicode characters anywhere.
- Do NOT use table format with | pipes. Use plain text lists.
- NO MARKDOWN BOLDING OR ASTERISKS ANYWHERE IN THE OUTPUT.
- USE PLAIN TEXT ONLY.`;

export default function PPDTPage() {
  const [loading, setLoading] = useState(false);
  const [picturePreview, setPicturePreview] = useState<string | null>(null);
  const [pictureBase64, setPictureBase64] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const { saveToHistory } = useHistorySave();

  const handleClear = () => {
    setPicturePreview(null);
    setPictureBase64(null);
    setAnalysis(null);
    if (document.getElementById('ppdt-pic')) (document.getElementById('ppdt-pic') as HTMLInputElement).value = '';
  };

  const handlePictureUpload = async (file: File) => {
    const base64 = await fileToBase64(file);
    setPicturePreview(base64);
    setPictureBase64(base64);
    toast.success('PPDT picture uploaded');
  };

  const analyzePicture = async () => {
    if (!pictureBase64) {
      toast.error('Please upload a PPDT picture first');
      return;
    }

    setLoading(true);
    try {
      const mimeType = pictureBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
      const result = await callGeminiMultiPart(
        PPDT_PROMPT + `\n\nAnalyze this PPDT picture. Provide complete perception, stories, and narration scripts.`,
        [{ base64: pictureBase64, mimeType }]
      );

      const cleanResult = result.replace(/\*/g, '');
      setAnalysis(cleanResult);
      saveToHistory('PPDT', { type: 'picture-analysis' }, cleanResult);
      toast.success('PPDT analysis complete');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 scroll-reveal">
      <div className="gold-border-left flex items-center justify-between">
        <div>
          <h1 className="text-2xl">PPDT — Picture Perception & Description Test</h1>
          <p className="text-muted-foreground font-body text-sm mt-1">
            Upload a hazy PPDT picture to get AI-generated stories, perception analysis, and narration scripts.
          </p>
        </div>
        {(analysis || picturePreview) && (
          <button onClick={handleClear} className="glass-button text-xs flex items-center gap-2 text-destructive hover:bg-destructive/10 border-destructive/20 transition-all duration-300">
             <Trash2 className="h-3.5 w-3.5" />
             Clear All
          </button>
        )}
      </div>

      <div className="gold-stripe" />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* Picture Upload */}
          <div className="glass-card">
            <label className="block text-sm font-heading font-semibold text-gold mb-2">PPDT Picture</label>
            {picturePreview ? (
              <div className="relative">
                <img src={picturePreview} alt="PPDT Picture" className="max-h-[200px] w-full object-contain bg-muted/20 rounded-xl" />
                <button onClick={() => document.getElementById('ppdt-pic')?.click()}
                  className="absolute top-2 right-2 glass-button-gold text-[10px] px-2.5 py-1">Change</button>
              </div>
            ) : (
              <div onClick={() => document.getElementById('ppdt-pic')?.click()}
                className="border border-dashed border-border/50 hover:border-gold/40 p-8 flex flex-col items-center gap-2 cursor-pointer transition-all duration-300 rounded-xl hover:bg-muted/10">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                <p className="text-xs text-muted-foreground font-body">Upload the PPDT picture (usually hazy/blurry)</p>
              </div>
            )}
            <input id="ppdt-pic" type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) { handlePictureUpload(f); e.target.value = ''; } }} />
          </div>

          {analysis && !loading ? (
            <div className="glass-card-subtle border-gold/20 text-center py-4 px-6 relative overflow-hidden flex flex-col gap-4">
              <div className="absolute inset-0 bg-gold/5 blur-xl"></div>
              <div>
                <p className="font-heading font-semibold text-sm text-gold mb-1 relative z-10">Analysis Complete</p>
                <p className="font-body text-xs text-muted-foreground relative z-10 leading-relaxed max-w-md mx-auto">
                  PPDT analysis is ready. To practice a new picture, discard your current response below.
                </p>
              </div>
              <div className="flex gap-3 justify-center relative z-10 mt-2">
                <button onClick={handleClear} className="glass-button text-xs px-4 py-2 hover:border-destructive hover:text-destructive flex items-center gap-2">
                   Delete & Upload New Image
                </button>
              </div>
            </div>
          ) : (
            <button onClick={analyzePicture} disabled={!pictureBase64 || loading}
              className="w-full glass-button-gold py-3.5 disabled:opacity-40 glow-gold">
              {loading ? 'ANALYZING PICTURE...' : 'ANALYZE PPDT PICTURE'}
            </button>
          )}
        </div>

        <div>
          {loading ? (
            <LoadingCard message="Analyzing PPDT picture... perceiving characters... generating stories..." />
          ) : analysis ? (
            <AnalysisOutput content={analysis} title="PPDT Analysis & Stories" />
          ) : (
            <div className="glass-card flex items-center justify-center min-h-[200px] text-muted-foreground font-heading text-sm">
              Analysis will appear here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
