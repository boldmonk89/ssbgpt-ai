import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { AnalysisOutput } from '@/components/AnalysisOutput';
import { callGemini, callGeminiMultiPart, fileToBase64 } from '@/lib/gemini';
import { 
  SYSTEM_PROMPT_TAT, 
  SYSTEM_PROMPT_WAT, 
  SYSTEM_PROMPT_SRT, 
  SYSTEM_PROMPT_PPDT 
} from '@/lib/prompts';
import { Loader2, Upload, ImageIcon, Pencil, Zap, Eye, EyeOff, Users, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, type Variants } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { usePracticeStore } from '@/store/practiceStore';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15
    }
  }
};

export default function AIPracticePage() {
  const {
    aiActiveTab: activeTab, setAiActiveTab: setActiveTab,
    tatImage, tatImageName, tatResult, setTatData,
    watWord, watResult, setWatData,
    srtSituation, srtResult, setSrtData,
    ppdtImage, ppdtImageName, ppdtResult, setPpdtData
  } = usePracticeStore();

  const [showOlqTags, setShowOlqTags] = useState(true);
  const [tatLoading, setTatLoading] = useState(false);
  const [watLoading, setWatLoading] = useState(false);
  const [srtLoading, setSrtLoading] = useState(false);
  const [ppdtLoading, setPpdtLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleClearTat = () => { setTatData({ result: '', image: null, name: '' }); if (document.getElementById('tat-upload')) (document.getElementById('tat-upload') as HTMLInputElement).value = ''; };
  const handleClearWat = () => { setWatData({ result: '', word: '' }); };
  const handleClearSrt = () => { setSrtData({ result: '', situation: '' }); };
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
      const result = await callGeminiMultiPart(
        SYSTEM_PROMPT_TAT + `\n\nGenerate high-fidelity TAT stories for this picture. Analyze its psychology, OLQs, and Mansa-Vacha-Karma alignment.`,
        [{ base64: tatImage, mimeType: 'image/jpeg' }]
      );
      
      setTatData({ result, image: tatImage, name: tatImageName });
      toast.success('TAT practiced');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setTatLoading(false);
    }
  };

  const analyzeWat = async () => {
    if (!watWord.trim()) {
      toast.error('Please enter a word');
      return;
    }

    setWatLoading(true);
    setWatData({ result: '' });
    try {
      const result = await callGemini(
        SYSTEM_PROMPT_WAT + `\n\nProvide model associations and psych analysis for the word: "${watWord}".`
      );
      
      setWatData({ word: watWord, result });
      toast.success('WAT practiced');
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
      const result = await callGemini(SYSTEM_PROMPT_SRT + `\n\nThe situation is: "${trimmed}"\n\nGenerate SRT reactions as instructed.`);

      setSrtData({ situation: trimmed, result });
      toast.success('SRT Analysis complete');
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
      const result = await callGeminiMultiPart(
        SYSTEM_PROMPT_PPDT + `\n\nAnalyze this PPDT picture. Provide complete stories, perception table, and narration script.`,
        [{ base64: ppdtImage, mimeType: 'image/jpeg' }]
      );
      setPpdtData({ result, image: ppdtImage, name: ppdtImageName });
      toast.success('PPDT Analysis complete');
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

      <motion.div variants={itemVariants} className="flex justify-end gap-4 p-4">
        <button
          onClick={() => setShowOlqTags(!showOlqTags)}
          className="glass-button flex items-center gap-2 text-xs"
        >
          {showOlqTags ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
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
              <label className="glass-card-subtle flex flex-col items-center justify-center p-6 cursor-pointer hover:border-gold/40 transition-colors border-2 border-dashed border-border/40 rounded-xl min-h-[160px]">
                <input type="file" accept="image/*" className="hidden" onChange={handleTatImageUpload} id="tat-upload" />
                {tatImage ? (
                  <div className="space-y-3 text-center">
                    <img src={tatImage} alt="TAT" className="max-h-32 rounded-lg mx-auto shadow-lg" />
                    <p className="text-[10px] text-muted-foreground font-body">{tatImageName}</p>
                    <p className="text-[10px] text-gold uppercase tracking-tighter">Click to change image</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-gold/40 mb-2" />
                    <p className="text-xs text-muted-foreground font-body">Upload Stimulus Image</p>
                  </>
                )}
              </label>

              <button
                onClick={analyzeTat}
                disabled={tatLoading || !tatImage}
                className="glass-button-gold w-full h-12 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {tatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'GENERATE ANALYSIS'}
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
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gold/60 uppercase tracking-widest pl-1">Stimulus Word</p>
                <Input
                  placeholder="e.g., Failure, Courage, Discipline..."
                  value={watWord}
                  onChange={(e) => setWatData({ word: e.target.value })}
                  className="h-12 text-sm bg-background/50 border-border/20 focus:border-gold/30"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={analyzeWat}
                  disabled={watLoading || !watWord.trim()}
                  className="glass-button-gold flex-1 h-12 flex items-center justify-center gap-2 text-sm"
                >
                  {watLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'GENERATE ANALYSIS'}
                </button>
                {watResult && (
                  <button onClick={handleClearWat} className="glass-button px-4 border-destructive/20 text-destructive">
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
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gold/60 uppercase tracking-widest pl-1">Stimulus Situation</p>
                <Textarea
                  placeholder="Describe the situation..."
                  value={srtSituation}
                  onChange={(e) => setSrtData({ situation: e.target.value })}
                  className="min-h-[100px] text-sm bg-background/50 border-border/20 focus:border-gold/30"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={analyzeSrt}
                  disabled={srtLoading || !srtSituation.trim()}
                  className="glass-button-gold flex-1 h-12 flex items-center justify-center gap-2 text-sm"
                >
                  {srtLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'GENERATE ANALYSIS'}
                </button>
                {srtResult && (
                  <button onClick={handleClearSrt} className="glass-button px-4 border-destructive/20 text-destructive">
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
          <div className="glass-card pt-6">
            <h3 className="font-heading font-bold text-base text-gold gold-border-left mb-4">PPDT Practice</h3>
            <div className="space-y-4">
              <label className="glass-card-subtle flex flex-col items-center justify-center p-6 cursor-pointer hover:border-gold/40 transition-colors border-2 border-dashed border-border/40 rounded-xl min-h-[160px]">
                <input type="file" accept="image/*" className="hidden" onChange={handlePpdtImageUpload} id="ppdt-upload" />
                {ppdtImage ? (
                  <div className="space-y-3 text-center">
                    <img src={ppdtImage} alt="PPDT" className="max-h-32 rounded-lg mx-auto shadow-lg" />
                    <p className="text-[10px] text-muted-foreground font-body">{ppdtImageName}</p>
                    <p className="text-[10px] text-gold uppercase tracking-tighter">Click to change image</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-gold/40 mb-2" />
                    <p className="text-xs text-muted-foreground font-body">Upload PPDT Image</p>
                  </>
                )}
              </label>

              <button
                onClick={analyzePpdt}
                disabled={ppdtLoading || !ppdtImage}
                className="glass-button-gold w-full h-12 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
              >
                {ppdtLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'GENERATE ANALYSIS'}
              </button>
              {ppdtResult && (
                  <button onClick={handleClearPpdt} className="glass-button w-full h-10 border-destructive/20 text-destructive flex items-center justify-center gap-2">
                    <Trash2 className="h-4 w-4" /> Clear All
                  </button>
                )}
            </div>
          </div>

          {ppdtResult && <AnalysisOutput content={ppdtResult} title="AI-Generated PPDT Story & Narration" />}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
