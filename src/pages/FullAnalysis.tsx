import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Timer, FileText, Share2, Shield, Upload, Clock, AlertTriangle, CheckCircle, Zap, UserCircle } from 'lucide-react';
import { WAT_WORDS, SRT_SITUATIONS } from '@/data/psychTestData';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { SkeletonAnalysis } from '@/components/SkeletonAnalysis';
import { buildFullReportPrompt, callGemini } from '@/lib/gemini';

// We'll shuffle these pools to pick the test sets
const shuffle = (array: any[]) => [...array].sort(() => Math.random() - 0.5);

type TestStep = 'INSTRUCTIONS' | 'PIQ' | 'TAT' | 'WAT' | 'SRT' | 'SD' | 'FEEDBACK' | 'ANALYSIS';

function convertMarkdownToHtml(text: string): string {
  const cleanText = text.replace(/\*\*/g, ''); 
  return cleanText.replace(/\*\*\*/g, '');
}

const speak = (text: string) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1;
  speechSynthesis.speak(utterance);
};

export default function FullAnalysisPage() {
  const { examStats, setExamStats } = useAppStore();
  const [step, setStep] = useState<TestStep>('INSTRUCTIONS');
  const [progress, setProgress] = useState(0);
  const [piqFile, setPiqFile] = useState<File | null>(null);

  // States for shuffling
  const [tatPool, setTatPool] = useState<any[]>([]);
  const [watPool, setWatPool] = useState<any[]>([]);
  const [srtPool, setSrtPool] = useState<any[]>([]);

  useEffect(() => {
    // Shuffling on mount for this session
    setWatPool(shuffle(WAT_WORDS).slice(0, 60));
    setSrtPool(shuffle(SRT_SITUATIONS).slice(0, 60));
  }, []);

  const nextStep = () => {
    const steps: TestStep[] = ['INSTRUCTIONS', 'PIQ', 'TAT', 'WAT', 'SRT', 'SD', 'ANALYSIS'];
    const currentIdx = steps.indexOf(step);
    if (currentIdx < steps.length - 1) {
      setStep(steps[currentIdx + 1]);
      setProgress(((currentIdx + 1) / (steps.length - 1)) * 100);
    }
  };

  return (
    <div className="space-y-6 scroll-reveal pb-20 font-serif">
      <div className="border-l-2 border-gold pl-4">
        <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">SSB Psychological Examination</h1>
        <p className="text-muted-foreground font-body text-[10px] mt-1 uppercase tracking-widest opacity-60">Mansa-Vacha-Karma Verification Matrix</p>
      </div>

      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md py-4 border-b border-border/30">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[10px] uppercase tracking-widest font-heading font-bold text-gold">{step.replace('_', ' ')}</span>
          <span className="text-[10px] uppercase tracking-widest font-heading font-bold text-muted-foreground">{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {step === 'INSTRUCTIONS' && <InstructionsSection onStart={nextStep} />}
      {step === 'PIQ' && <PiqStep onComplete={nextStep} />}
      {step === 'TAT' && <TatStep onComplete={nextStep} />}
      {step === 'WAT' && <WatStep onComplete={nextStep} />}
      {step === 'SRT' && <SrtStep onComplete={nextStep} />}
      {step === 'SD' && <SdStep onComplete={nextStep} />}
      {step === 'ANALYSIS' && <FinalAnalysisStep stats={examStats} />}
    </div>
  );
}

function InstructionsSection({ onStart }: { onStart: () => void }) {
  return (
    <div className="glass-card stagger-children p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center">
          <Shield className="h-6 w-6 text-gold" />
        </div>
        <div>
          <h2 className="text-xl font-heading font-bold">Standard SSB Procedure</h2>
          <p className="text-xs text-muted-foreground">Follow instructions carefullly. Timers are absolute.</p>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card-subtle">
            <h3 className="text-sm font-heading font-bold text-gold mb-2">TAT (12 Pictures)</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">30 seconds to view picture, 4 minutes to write. Auto-shuffles every slide.</p>
          </div>
          <div className="glass-card-subtle">
            <h3 className="text-sm font-heading font-bold text-gold mb-2">WAT (60 Words)</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">15 seconds per word. Flashes automatically. Break after every 15 words.</p>
          </div>
          <div className="glass-card-subtle">
            <h3 className="text-sm font-heading font-bold text-gold mb-2">SRT (60 Scenarios)</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">45 minutes total for 60 situations. Write responses instinctively.</p>
          </div>
          <div className="glass-card-subtle">
            <h3 className="text-sm font-heading font-bold text-gold mb-2">SD (5 Paragraphs)</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">15 minutes for 5 paragraphs under standard headings.</p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
            <p className="text-[11px] text-destructive leading-relaxed">
              WARNING: This is a continuous examination. Ensure you have 2+ hours and a pen/paper ready. You must upload your PDFs at each milestone to receive the final Clinical Report.
            </p>
          </div>
        </div>

        <Button 
          size="xl" 
          onClick={onStart} 
          className="w-full h-20 text-xl font-heading font-black tracking-tighter shadow-2xl transition-all bg-gold hover:bg-gold/90 text-background"
        >
          START FULL PSYCH ANALYSIS
        </Button>
      </div>
    </div>
  );
}

function PiqStep({ onComplete }: { onComplete: () => void }) {
  const [isUploaded, setIsUploaded] = useState(false);

  return (
    <div className="glass-card stagger-children p-10 text-center space-y-8">
      <div className="mx-auto h-20 w-20 rounded-3xl bg-gold/10 border border-gold/20 flex items-center justify-center">
        <UserCircle className="h-10 w-10 text-gold" />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-2xl font-heading font-bold">Step 1: Universal Context</h2>
        <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
          Upload your PIQ (Personal Information Questionnaire) form. This helps our AI psychologists establish your baseline life-history profile.
        </p>
      </div>

      <div className="flex flex-col items-center gap-4">
        {!isUploaded ? (
          <div className="w-full max-w-sm border-2 border-dashed border-gold/30 rounded-2xl p-8 hover:border-gold/60 transition-colors bg-gold/5 group">
            <Upload className="h-8 w-8 text-gold mx-auto mb-4 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-gold uppercase tracking-widest mb-1">Click to Upload PIQ PDF</p>
            <p className="text-[10px] text-muted-foreground">Supports PDF, JPG, PNG — Maximum 5MB</p>
            <input 
              type="file" 
              className="absolute inset-0 opacity-0 cursor-pointer" 
              onChange={() => {
                setIsUploaded(true);
                toast.success('PIQ uploaded successfully');
              }}
            />
          </div>
        ) : (
          <div className="w-full max-w-sm rounded-2xl p-6 bg-success/10 border border-success/30 flex items-center gap-4">
             <div className="h-10 w-10 rounded-full bg-success/20 flex items-center justify-center">
               <CheckCircle className="h-5 w-5 text-success" />
             </div>
             <div className="text-left">
               <p className="text-sm font-bold text-success">PIQ Data Captured</p>
               <p className="text-[10px] text-muted-foreground">baseline_profile.pdf (Ready for analysis)</p>
             </div>
          </div>
        )}
      </div>

      <Button 
        disabled={!isUploaded} 
        onClick={onComplete} 
        size="lg"
        className="w-full max-w-xs"
      >
        Proceed to TAT Test
      </Button>
    </div>
  );
}

function TatStep({ onComplete }: { onComplete: () => void }) {
  const [index, setIndex] = useState(0);
  const [isViewing, setIsViewing] = useState(true);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isFinished, setIsFinished] = useState(false);

  const tatImagePaths = Array.from({ length: 20 }, (_, i) => `/tat/tat${i + 1}.png`);
  const [activeTatSet, setActiveTatSet] = useState<string[]>([]);

  useEffect(() => {
    const shuffled = shuffle(tatImagePaths).slice(0, 11);
    setActiveTatSet(shuffled);
  }, []);

  const totalSlides = 12;

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isFinished) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (isViewing) {
              setIsViewing(false);
              speak("Begin writing."); 
              return 240; 
            } else {
              if (index < totalSlides - 1) {
                setIndex(index + 1);
                setIsViewing(true);
                speak("Stop writing."); 
                return 30;
              } else {
                speak("Stop writing.");
                setIsFinished(true);
                return 0;
              }
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isViewing, index, isFinished]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (isFinished) {
    return (
      <div className="glass-card text-center py-12 space-y-6">
        <div className="h-16 w-16 bg-success/20 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-2xl font-heading font-bold">TAT Completed</h2>
        <p className="text-muted-foreground">Upload your TAT stories (1-12) as a PDF or high-quality image.</p>
        <div className="flex flex-col items-center gap-4">
          <Button variant="outline" className="w-full max-w-sm border-dashed border-2 py-8">
            <Upload className="mr-2 h-4 w-4" /> Upload TAT PDF
          </Button>
          <Button onClick={onComplete} className="w-full max-w-sm">Continue to WAT</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card space-y-6 flex flex-col items-center">
      <div className="flex justify-between w-full px-2">
        <span className="text-xs font-bold text-white uppercase tracking-widest opacity-60">SCENE {index + 1} / {totalSlides}</span>
        <div className="flex items-center gap-2 text-gold opacity-0">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-mono font-bold">{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-border/40 bg-black/40 flex items-center justify-center">
        {isViewing ? (
          index < 11 ? (
            <img 
              src={activeTatSet[index]} 
              alt={`TAT Scene ${index + 1}`}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.querySelector('.fallback')?.classList.remove('hidden');
              }}
            />
          ) : (
            <div className="absolute inset-0 bg-white" /> 
          )
        ) : (
          <div className="flex flex-col items-center gap-4 p-8 text-center">
            <h3 className="text-xl font-heading font-bold text-gold">WRITE YOUR STORY</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">Focus on: What is happening? What led to this? What is the outcome? What are the feelings of the characters?</p>
          </div>
        )}
        <div className="fallback hidden absolute inset-0 flex flex-col items-center justify-center bg-muted/20 text-muted-foreground p-6 text-center">
          <AlertTriangle className="h-8 w-8 mb-2 opacity-20" />
          <p className="text-[10px] uppercase tracking-widest font-bold">Image Not Found</p>
          <p className="text-[8px] mt-1 opacity-60">Please ensure 'tat{index + 1}.jpg' is in public/tat/ folder</p>
        </div>
      </div>

      <div className="text-center">
        <p className="text-xs text-muted-foreground lowercase italic">
          {isViewing ? 'Observe the scene carefully...' : 'Writing time active. Word limit: none.'}
        </p>
      </div>
    </div>
  );
}

function WatStep({ onComplete }: { onComplete: () => void }) {
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [showWord, setShowWord] = useState(true); 
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isFinished) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (showWord && (index + 1) % 15 === 0 && index < 59) {
              setShowWord(false);
              speak("Turn page. You have 15 seconds to prepare for the next set.");
              return 15; 
            } else {
              if (index < 59) {
                if (!showWord) setShowWord(true); 
                setIndex((i) => i + 1);
                if (index % 15 === 14) speak("Begin next 15 words."); 
                return 15;
              } else {
                speak("WAT test complete. Upload your response sheet.");
                setIsFinished(true);
                return 0;
              }
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [index, isFinished, showWord]);

  if (isFinished) {
    return (
      <div className="glass-card text-center py-12 space-y-6">
        <div className="h-16 w-16 bg-success/20 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="h-8 w-8 text-success" />
        </div>
        <h2 className="text-2xl font-heading font-bold">WAT Completed</h2>
        <p className="text-muted-foreground">Upload your 60 sentences as a PDF.</p>
        <div className="flex flex-col items-center gap-4">
          <Button variant="outline" className="w-full max-w-sm border-dashed border-2 py-8">
            <Upload className="mr-2 h-4 w-4" /> Upload WAT PDF
          </Button>
          <Button onClick={onComplete} className="w-full max-w-sm">Continue to SRT</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card h-96 flex flex-col items-center justify-center space-y-8 relative overflow-hidden">
      <div className="absolute top-4 left-4">
        <span className="text-xs font-heading font-bold text-gold/60 uppercase tracking-widest">WAT Sequence</span>
      </div>
      <div className="absolute top-4 right-4 flex items-center gap-2 text-gold font-mono font-bold opacity-0">
        <Clock className="h-4 w-4" />
        <span>0:{timeLeft < 10 ? '0' : ''}{timeLeft}</span>
      </div>

      <div className="flex flex-col items-center gap-2">
        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Word {index + 1} of 60</span>
        <div className="h-1 w-32 bg-muted/30 rounded-full overflow-hidden">
          <div className="h-full bg-gold transition-all duration-1000" style={{ width: `${(timeLeft / 15) * 100}%` }} />
        </div>
      </div>

      <div className="text-center py-10 scale-110">
        {showWord ? (
          <h2 className="text-6xl font-heading font-black tracking-tighter text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] animate-in zoom-in-95 duration-300">
            {WAT_WORDS[index]?.word.toUpperCase() || '---'}
          </h2>
        ) : (
          <div className="space-y-2 animate-pulse">
            <h2 className="text-4xl font-heading font-bold text-gold uppercase tracking-[0.3em]">TURN PAGE</h2>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Prepare for next set of 15</p>
          </div>
        )}
      </div>

      <div className="absolute bottom-4 left-0 right-0 text-center">
        <p className="text-[10px] text-muted-foreground italic lowercase px-8">
          Observe and write the first thought that comes to your mind.
        </p>
      </div>
    </div>
  );
}

function SrtStep({ onComplete }: { onComplete: () => void }) {
  const [timeLeft, setTimeLeft] = useState(2700); 
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (isFinished) {
    return (
      <div className="glass-card text-center py-12 space-y-6">
        <h2 className="text-2xl font-heading font-bold">Time Up!</h2>
        <p className="text-muted-foreground">The 45-minute SRT block has ended. Upload your responses now.</p>
        <div className="flex flex-col items-center gap-4">
          <Button variant="outline" className="w-full max-w-sm border-dashed border-2 py-8">
            <Upload className="mr-2 h-4 w-4" /> Upload SRT PDF
          </Button>
          <Button onClick={onComplete} className="w-full max-w-sm">Continue to SD</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-card-subtle flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5 text-gold" />
          <h2 className="text-lg font-heading font-bold">Situation Reaction Test</h2>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-black/40 rounded-xl border border-gold/20 text-gold font-mono font-bold opacity-0">
          <Timer className="h-4 w-4 animate-pulse" />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
        {SRT_SITUATIONS.slice(0, 60).map((srt, i) => (
          <div key={srt.id} className="glass-card-subtle p-4 border-l-2 border-gold/40 hover:border-gold transition-colors">
            <div className="flex gap-4">
              <span className="text-[10px] font-heading font-black text-gold/40 mt-1">{i + 1}</span>
              <p className="text-xs leading-relaxed font-body italic text-muted-foreground/90">{srt.situation}</p>
            </div>
          </div>
        ))}
      </div>

      <Button onClick={onComplete} variant="gold" className="w-full">Finished Writing? Continue to SD</Button>
    </div>
  );
}

function SdStep({ onComplete }: { onComplete: () => void }) {
  const [timeLeft, setTimeLeft] = useState(900); 
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const HEADINGS = [
    'What your Parents think of you',
    'What your Teachers think of you',
    'What your Friends think of you',
    'What YOU think of yourself',
    'Qualities you wish to develop'
  ];

  if (isFinished) {
    return (
      <div className="glass-card text-center py-12 space-y-6">
        <h2 className="text-2xl font-heading font-bold">SD Completed</h2>
        <p className="text-muted-foreground">Upload your final SD response PDF.</p>
        <div className="flex flex-col items-center gap-4">
          <Button variant="outline" className="w-full max-w-sm border-dashed border-2 py-8">
            <Upload className="mr-2 h-4 w-4" /> Upload SD PDF
          </Button>
          <Button onClick={onComplete} className="w-full max-w-sm">Get Clinical Report</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-card-subtle flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-gold" />
          <h2 className="text-lg font-heading font-bold">Self Description</h2>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-black/40 rounded-xl border border-gold/20 text-gold font-mono font-bold opacity-0">
          <Timer className="h-4 w-4" />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {HEADINGS.map((h, i) => (
          <div key={i} className="glass-card-subtle p-4">
            <h3 className="text-xs font-heading font-bold text-gold uppercase mb-2 tracking-wider">{h}</h3>
            <div className="h-1 gold-stripe w-12 mb-3" />
            <p className="text-[11px] text-muted-foreground italic leading-relaxed">Prepare his section on your sheet with complete honesty. Balance your strengths and weaknesses as others see you.</p>
          </div>
        ))}
      </div>

      <Button onClick={onComplete} variant="gold" className="w-full">Finished Analysis? Proceed to Final Report</Button>
    </div>
  );
}

const mockOlqData = [
  { subject: 'Eff Intel', A: 85, fullMark: 100 },
  { subject: 'Reasoning', A: 70, fullMark: 100 },
  { subject: 'Organizing', A: 90, fullMark: 100 },
  { subject: 'Expression', A: 75, fullMark: 100 },
  { subject: 'Adapting', A: 80, fullMark: 100 },
  { subject: 'Cooperate', A: 95, fullMark: 100 },
  { subject: 'Responsibility', A: 88, fullMark: 100 },
  { subject: 'Initiative', A: 72, fullMark: 100 },
  { subject: 'Confidence', A: 82, fullMark: 100 },
  { subject: 'Decision', A: 65, fullMark: 100 },
  { subject: 'Influence', A: 78, fullMark: 100 },
  { subject: 'Lively', A: 92, fullMark: 100 },
  { subject: 'Determination', A: 85, fullMark: 100 },
  { subject: 'Courage', A: 80, fullMark: 100 },
  { subject: 'Stamina', A: 70, fullMark: 100 },
];

function FinalAnalysisStep({ stats }: { stats: any }) {
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');

  const handleGenerate = async () => {
    if (stats.tatAttempted + stats.watAttempted + stats.srtAttempted + stats.sdAttempted === 0) {
      setAnalysisResult("⚠️ You haven't attempted any tests yet. Please complete some sessions before generating a matrix report.");
      return;
    }
    setLoading(true);
    try {
      const prompt = buildFullReportPrompt(
        { mode: "Full Psych Exam (Strict Calibration)" },
        "Strict 12 TAT Set completed under proctored timer.",
        "60 WAT words processed in sequential 15s flash mode.",
        "45 Minute SRT block synthesized into 15-per-page responses.",
        "SD composite evaluated against standard SSB descriptors."
      );
      const res = await callGemini(prompt + "\n\nIMPORTANT: This is the FULL PSYCH REPORT. Be extremely professional and strictly verify Mansa-Vacha-Karma alignment. DO NOT use markdown bolding (**) in your response.");
      setAnalysisResult(res.replace(/\*\*/g, ''));
    } catch (e: any) {
      toast.error("Deep Matrix synthesis failed");
    } finally {
      setLoading(false);
    }
  };

  if (!analysisResult && !loading) return (
     <div className="max-w-3xl mx-auto py-10 text-center">
        <div className="glass-card p-12 bg-black/40 border-gold/40 border-t-8 shadow-2xl space-y-6">
           <BrainCircuit className="h-16 w-16 text-gold mx-auto animate-pulse" />
           <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white tracking-tight uppercase font-sans">Execute Synthesis Engine</h2>
              <p className="text-muted-foreground uppercase tracking-[0.4em] text-[9px] font-bold opacity-60">Connecting with Psychomotor Clinical Hub...</p>
           </div>
           <Button onClick={handleGenerate} size="xl" className="w-full h-16 text-xl font-black tracking-widest bg-gold text-black shadow-2xl uppercase">
              GENERATE PSYCH CLINICAL REPORT
           </Button>
        </div>
     </div>
  );

  if (loading) return (
    <div className="space-y-6">
       <div className="text-center space-y-2 mb-8">
         <h2 className="text-2xl font-heading font-bold animate-pulse">Synthesizing Personality...</h2>
         <p className="text-xs text-muted-foreground uppercase tracking-widest">Applying Mansa-Vacha-Karma Verification Matrix</p>
       </div>
       <SkeletonAnalysis />
    </div>
  );

  return (
    <div className="glass-card text-center py-12 space-y-6 stagger-children min-h-screen">
      <div className="relative inline-block">
        <div className="absolute inset-0 bg-gold/20 blur-xl rounded-full animate-pulse" />
        <CheckCircle className="h-20 w-20 text-gold relative z-10" />
      </div>
      <h2 className="text-3xl font-heading font-black tracking-tight">Examination Complete</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-8">
        {[
          { icon: Shield, label: 'Cross-Match', desc: 'Alignment between PIQ and Psych Tests', val: '86%', color: 'text-gold' },
          { icon: AlertTriangle, label: 'Stress Index', desc: 'Detected anxiety/pressure markers', val: 'Low', color: 'text-success' },
          { icon: Zap, label: 'OLQ Consistency', val: 'High', desc: 'Stability of qualities across tasks', color: 'text-gold' },
          { icon: CheckCircle, label: 'Readiness', val: 'Recommended', desc: 'Officer Potential Level', color: 'text-gold' },
        ].map((item, i) => (
          <div key={i} className="glass-card-subtle p-6 hover:scale-105 transition-all cursor-default group">
            <item.icon className={`h-6 w-6 mx-auto mb-3 ${item.color} group-hover:scale-110 transition-transform`} />
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">{item.label}</p>
            <p className={`text-2xl font-heading font-black ${item.color}`}>{item.val}</p>
            <p className="text-[10px] text-muted-foreground/60 mt-2 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card-subtle flex flex-col items-center justify-center p-6 h-[450px]">
          <div className="text-gold font-bold mb-4 uppercase text-[10px] tracking-[0.2em]">15 OLQ Assessment Matrix</div>
          <p className="text-[10px] text-muted-foreground mb-4 italic">Click axis labels to view evidence (Coming Soon)</p>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={mockOlqData}>
              <PolarGrid stroke="#ffffff20" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 10, fontWeight: 'bold' }} />
              <Radar
                name="OLQ Score"
                dataKey="A"
                stroke="#EAB308"
                fill="#EAB308"
                fillOpacity={0.5}
                className="hover:fill-opacity-80 transition-all cursor-pointer"
              />
              <Tooltip 
                contentStyle={{ background: '#0a1628', border: '1px solid #EAB308', borderRadius: '12px', fontSize: '10px' }}
                itemStyle={{ color: '#EAB308', fontWeight: 'bold' }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-4 text-left">
           <div className="glass-card-subtle p-6">
             <h3 className="text-sm font-heading font-bold text-gold mb-3 flex items-center gap-2">
               <Zap className="h-4 w-4" /> Strongest OLQ Signals
             </h3>
             <div className="space-y-3">
               {['Organizing Ability', 'Cooperation', 'Liveliness'].map((olq, i) => (
                 <div key={i} className="p-3 rounded-lg bg-gold/5 border border-gold/10 hover:border-gold/30 transition-all">
                    <p className="text-xs font-bold text-foreground">{olq}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed italic">Evidence found in TAT Story 3 and WAT responses for "TEAM" and "DUTY".</p>
                 </div>
               ))}
             </div>
           </div>

           <div className="glass-card p-6 border-gold/40">
             <h3 className="text-sm font-heading font-bold text-gold mb-2">Psychologist's Recommendation</h3>
             <p className="text-xs text-muted-foreground leading-relaxed">
               Your psychological profile exhibits high internal consistency. The alignment between your PIQ claims and WAT/SRT reactions suggests a genuine and officer-like mindset. Focus on maintaining this level of transparency during the IO interview.
             </p>
           </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-6">
        <Button size="xl" className="flex-1 h-14 text-sm font-black tracking-widest bg-gold hover:bg-gold/90 text-background">
          DOWNLOAD FULL CLINICAL REPORT
        </Button>
        <Button size="xl" variant="outline" className="flex-1 h-14 text-sm font-black tracking-widest border-gold/30 text-gold hover:bg-gold/5">
          SHARE WITH MENTOR
        </Button>
      </div>
    </div>
  );
}
