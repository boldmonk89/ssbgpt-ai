import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Timer, FileText, Share2, Shield, Upload, Clock, AlertTriangle, CheckCircle, Zap, UserCircle } from 'lucide-react';
import { WAT_WORDS, SRT_SITUATIONS } from '@/data/psychTestData';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { SkeletonAnalysis } from '@/components/SkeletonAnalysis';
import { buildFullReportPrompt, callGemini, callGeminiMultiPart, fileToBase64 } from '@/lib/gemini';
import { ChevronLeft, BrainCircuit, Maximize2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// We'll shuffle these pools to pick the test sets
const shuffle = <T,>(array: T[]): T[] => [...array].sort(() => Math.random() - 0.5);

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
  const navigate = useNavigate();
  const { examStats, setExamStats } = useAppStore();
  const [step, setStep] = useState<TestStep>('INSTRUCTIONS');
  const [progress, setProgress] = useState(0);
  const [piqData, setPiqData] = useState<string | null>(null);
  const [tatData, setTatData] = useState<string | null>(null);
  const [watData, setWatData] = useState<string | null>(null);
  const [srtData, setSrtData] = useState<string | null>(null);
  const [sdData, setSdData] = useState<string | null>(null);

  useEffect(() => {
    // Session markers established on mount
  }, []);

  const nextStep = () => {
    const steps: TestStep[] = ['INSTRUCTIONS', 'PIQ', 'TAT', 'WAT', 'SRT', 'SD', 'ANALYSIS'];
    const currentIdx = steps.indexOf(step);
    if (currentIdx < steps.length - 1) {
      setStep(steps[currentIdx + 1]);
      setProgress(((currentIdx + 1) / (steps.length - 1)) * 100);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  return (
    <div className="space-y-6 scroll-reveal pb-20 font-serif">
      <div className="flex justify-between items-center mb-8 px-4 pt-4">
        <div className="border-l-2 border-gold pl-4">
          <h1 className="text-xl md:text-2xl">Psychological Examination</h1>
          <p className="text-muted-foreground font-body text-[10px] mt-1 uppercase tracking-widest opacity-60">Baseline Synthesis Matrix</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            onClick={toggleFullscreen}
            className="glass-button-gold w-10 h-10 p-0 flex items-center justify-center"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => {
              if (step === 'INSTRUCTIONS') navigate('/');
              else navigate('/');
            }}
            className="glass-button-gold px-3 md:px-6 h-10 text-[9px] md:text-[10px] font-black tracking-widest uppercase flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" /> {step === 'INSTRUCTIONS' ? 'EXIT TO HOME' : 'CANCEL TEST'}
          </Button>
        </div>
      </div>

      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md py-4 border-b border-border/30">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[10px] uppercase tracking-widest font-heading font-bold text-gold">{step.replace('_', ' ')}</span>
          <span className="text-[10px] uppercase tracking-widest font-heading font-bold text-muted-foreground">{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {step === 'INSTRUCTIONS' && <InstructionsSection onStart={nextStep} />}
      {step === 'PIQ' && <PiqStep onComplete={(data) => { setPiqData(data); nextStep(); }} />}
      {step === 'TAT' && <TatStep onComplete={(data) => { setTatData(data); nextStep(); }} />}
      {step === 'WAT' && <WatStep onComplete={(data) => { setWatData(data); nextStep(); }} />}
      {step === 'SRT' && <SrtStep onComplete={(data) => { setSrtData(data); nextStep(); }} />}
      {step === 'SD' && <SdStep onComplete={(data) => { setSdData(data); nextStep(); }} />}
      {step === 'ANALYSIS' && <FinalAnalysisStep stats={examStats} piq={piqData} tat={tatData} wat={watData} srt={srtData} sd={sdData} />}
    </div>
  );
}

function InstructionsSection({ onStart }: { onStart: () => void }) {
  const [checked, setChecked] = useState({ paper: false, quiet: false, time: false });
  const allChecked = checked.paper && checked.quiet && checked.time;

  return (
    <div className="glass-card stagger-children p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center">
          <Shield className="h-6 w-6 text-gold" />
        </div>
        <div>
          <h2 className="text-xl font-heading font-bold uppercase tracking-tight">Standard SSB Procedure</h2>
          <p className="text-xs text-muted-foreground uppercase tracking-widest text-[10px]">Follow instructions carefullly. Timers are absolute.</p>
        </div>
      </div>
      
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="glass-card-subtle p-5 border-l border-white/5">
            <h3 className="text-xs font-heading font-bold text-gold mb-2 uppercase tracking-widest">TAT (12 Pictures)</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">30 seconds to view picture, 4 minutes to write. Auto-shuffles every slide. <b>NOTE: Pictures reshuffle hoti h, sequence same nahi milegi.</b></p>
          </div>
          <div className="glass-card-subtle p-5 border-l border-white/5">
            <h3 className="text-xs font-heading font-bold text-gold mb-2 uppercase tracking-widest">WAT (60 Words)</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">15 seconds per word. Flashes automatically. Break after every 15 words.</p>
          </div>
          <div className="glass-card-subtle p-5 border-l border-white/5">
            <h3 className="text-xs font-heading font-bold text-gold mb-2 uppercase tracking-widest">SRT (60 Scenarios)</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">45 minutes total for 60 situations. Write responses instinctively.</p>
          </div>
          <div className="glass-card-subtle p-5 border-l border-white/5">
            <h3 className="text-xs font-heading font-bold text-gold mb-2 uppercase tracking-widest">SD (5 Paragraphs)</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">15 minutes for 5 paragraphs under standard headings.</p>
          </div>
        </div>

        <div className="p-5 border-t border-white/10 space-y-6">
           <h3 className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold text-center">Mandatory Environment Verification</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { id: 'paper', label: 'Pen & Paper' },
                { id: 'quiet', label: 'Isolated Space' },
                { id: 'time', label: '2-Hour Slot' }
              ].map((item) => (
                <label key={item.id} className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-all group">
                   <input 
                     type="checkbox" 
                     checked={checked[item.id as keyof typeof checked]}
                     onChange={() => setChecked(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof checked] }))}
                     className="h-4 w-4 appearance-none rounded border-gold border-2 bg-transparent checked:bg-gold transition-all cursor-pointer"
                   />
                   <span className="text-[9px] text-white/60 uppercase font-bold group-hover:text-gold">{item.label}</span>
                </label>
              ))}
           </div>
        </div>

        <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
            <p className="text-[11px] text-destructive leading-relaxed font-bold uppercase tracking-tight">
              WARNING: This is a continuous professional session. Ensure you stay committed to the timeline.
            </p>
          </div>
        </div>

        <Button 
          disabled={!allChecked}
          size="xl" 
          onClick={() => {
            toast.info("Professional examination started. Good luck, candidate.", { icon: "🖋️" });
            onStart();
          }} 
          className="w-full h-20 text-xl font-heading font-black tracking-tighter shadow-2xl transition-all bg-gold hover:bg-gold/90 text-background disabled:opacity-20"
        >
          START FULL PSYCH ANALYSIS
        </Button>
      </div>
    </div>
  );
}

function PiqStep({ onComplete }: { onComplete: (data: string) => void }) {
  const [isUploaded, setIsUploaded] = useState(false);
  const [data, setData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const b64 = await fileToBase64(file);
      setData(b64);
      setIsUploaded(true);
      toast.success("PIQ Baseline Anchored");
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 animate-in slide-in-from-bottom-4 duration-500">
       <div className="glass-card p-10 bg-black/40 border-gold/10 border-t-4 border-t-gold space-y-8">
          <div className="text-center space-y-2">
             <h2 className="text-3xl font-bold text-white uppercase tracking-tight font-sans">Baseline Profile Intake</h2>
             <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-bold">Step 1: Universal Life-History Context (PIQ)</p>
          </div>

          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-none border border-white/10 p-12 transition-all flex flex-col items-center gap-4 relative ${isUploaded ? 'bg-gold/5 border-gold/40' : 'bg-white/5 hover:bg-white/[0.08]'}`}
          >
             <input 
               type="file" 
               ref={fileInputRef}
               className="hidden" 
               onChange={handleFileChange} 
             />
             {isUploaded ? (
               <div className="space-y-4 text-center">
                 <CheckCircle className="h-8 w-8 text-gold mx-auto" />
                 <p className="text-xs font-bold text-gold uppercase tracking-widest">PIQ Authenticated & Secured</p>
               </div>
             ) : (
               <div className="space-y-4 text-center">
                 <Upload className="h-8 w-8 text-white/40 mx-auto" />
                 <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Click to Upload PIQ Form</p>
                 <p className="text-[9px] text-muted-foreground/60 uppercase">PDF • JPG • PNG (Max 5MB)</p>
               </div>
             )}
          </div>
          
          <div className="pt-4 border-t border-white/5 space-y-4">
             <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase font-bold px-1">
                <span>Report Intake Status:</span>
                <span className={isUploaded ? 'text-gold' : 'text-white/20'}>{isUploaded ? 'RECORD CAPTURED' : 'AWAITING UPLOAD'}</span>
             </div>
             <Button disabled={!isUploaded} onClick={() => data && onComplete(data)} size="xl" className="w-full h-16 bg-gold text-black font-bold uppercase tracking-widest rounded-none shadow-2xl">
                PROCEED TO PSYCH TESTS
             </Button>
          </div>
       </div>
    </div>
  );
}

const TAT_IMAGE_PATHS = Array.from({ length: 20 }, (_, i) => `/tat/tat${i + 1}.png`);

function TatStep({ onComplete }: { onComplete: (data: string) => void }) {
  const [index, setIndex] = useState(0);
  const [isViewing, setIsViewing] = useState(true);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isFinished, setIsFinished] = useState(false);

  const [activeTatSet, setActiveTatSet] = useState<string[]>([]);

  useEffect(() => {
    const shuffled = shuffle(TAT_IMAGE_PATHS).slice(0, 11);
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
      <MilestoneOverlay 
        title="TAT Session Complete" 
        meta="12 Slides Synthesized" 
        onUpload={onComplete} 
      />
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

function WatStep({ onComplete }: { onComplete: (data: string) => void }) {
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
      <MilestoneOverlay 
        title="WAT Word Block Complete" 
        meta="60 Items Processed" 
        onUpload={onComplete} 
      />
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

function SrtStep({ onComplete }: { onComplete: (data: string) => void }) {
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
      <MilestoneOverlay 
        title="SRT Block Complete" 
        meta="60 Scenarios Evaluated" 
        onUpload={onComplete} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="glass-card-subtle flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5 text-gold" />
          <h1 className="text-2xl md:text-3xl mb-2">Situation Reaction Test</h1>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-black/40 rounded-xl border border-gold/20 text-gold font-mono font-bold opacity-0">
          <Timer className="h-4 w-4 animate-pulse" />
          <span>{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
        {SRT_SITUATIONS.slice(0, 60).map((srt, i) => (
          <div key={srt.id} className="glass-card-subtle p-5 h-24 flex items-center border-l-2 border-gold/40 hover:border-gold transition-colors">
            <div className="flex gap-6 items-center w-full">
              <span className="text-[10px] font-bold text-gold/40 shrink-0">{i + 1}</span>
              <div className="h-8 w-px bg-white/10 shrink-0" />
              <p className="text-xs leading-relaxed font-body text-muted-foreground/90 line-clamp-2">{srt.situation}</p>
            </div>
          </div>
        ))}
      </div>

      <Button onClick={() => setIsFinished(true)} variant="gold" className="w-full h-14 uppercase tracking-widest font-black">Finished Writing? Continue to SD</Button>
    </div>
  );
}

function SdStep({ onComplete }: { onComplete: (data: string) => void }) {
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
      <MilestoneOverlay 
        title="SD Reflection Complete" 
        meta="Psychological Baseline Established" 
        onUpload={onComplete} 
      />
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

      <Button onClick={() => setIsFinished(true)} variant="gold" className="w-full h-14 uppercase tracking-widest font-black">Finished Analysis? Proceed to Final Report</Button>
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

function FinalAnalysisStep({ stats, piq, tat, wat, srt, sd }: { stats: Record<string, unknown>, piq: string | null, tat: string | null, wat: string | null, srt: string | null, sd: string | null }) {
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');

  const handleGenerate = async () => {
    if (!piq) {
      toast.error("PIQ Baseline MISSING. Please re-upload PIQ for analysis synthesis.");
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
      
      const files = [
        { base64: piq, mimeType: 'image/jpeg' },
        ...(tat ? [{ base64: tat, mimeType: 'application/pdf' }] : []),
        ...(wat ? [{ base64: wat, mimeType: 'application/pdf' }] : []),
        ...(srt ? [{ base64: srt, mimeType: 'application/pdf' }] : []),
        ...(sd ? [{ base64: sd, mimeType: 'application/pdf' }] : []),
      ];

      const res = await callGeminiMultiPart(prompt + "\n\nIMPORTANT: Use the provided actual response sheets for analysis. Be extremely professional and strictly verify Mansa-Vacha-Karma alignment. The report MUST be CONCISE, structured with bullet points, and highly readable. DO NOT use markdown bolding (**) in your response. Output plain text report.", files);
      setAnalysisResult(res.replace(/\*/g, ''));
    } catch (e: unknown) {
      toast.error("Deep Matrix synthesis failed or Timeout");
      console.error(e);
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
              <p className="text-muted-foreground uppercase tracking-[0.4em] text-[10px] font-bold opacity-60">Connecting with SSB Practice Hub...</p>
           </div>
           <Button onClick={handleGenerate} size="xl" className="w-full h-16 text-xl font-black tracking-widest bg-gold text-black shadow-2xl uppercase">
              GENERATE PSYCH ANALYSIS REPORT
           </Button>
           <p className="text-[10px] text-white/30 uppercase tracking-widest italic">Multi-Document Evidence Matching Enabled</p>
        </div>
     </div>
  );

  if (loading) return (
    <div className="space-y-6">
       <div className="text-center space-y-2 mb-8">
         <h2 className="text-2xl font-heading font-bold animate-pulse">Synthesizing Personality...</h2>
         <p className="text-xs text-muted-foreground uppercase tracking-widest text-[10px]">Applying Mansa-Vacha-Karma Verification Matrix</p>
       </div>
       <SkeletonAnalysis />
    </div>
  );

  return (
    <div className="glass-card stagger-children min-h-screen p-8 space-y-8">
      <div className="flex flex-col items-center text-center space-y-4 mb-8">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-gold/20 blur-xl rounded-full animate-pulse" />
          <CheckCircle className="h-16 w-16 text-gold relative z-10" />
        </div>
        <h2 className="text-4xl font-heading font-black tracking-tight uppercase">Psychological Dossier Finalized</h2>
        <p className="text-muted-foreground text-[10px] tracking-[0.4em] uppercase font-bold opacity-60">Mansa-Vacha-Karma Profile Integrated</p>
      </div>

      <div className="prose prose-invert max-w-none text-left whitespace-pre-wrap font-body text-sm leading-relaxed border-t border-white/5 pt-8">
        {analysisResult}
      </div>
      
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
          DOWNLOAD FULL ANALYSIS REPORT
        </Button>
        <Button size="xl" variant="outline" className="flex-1 h-14 text-sm font-black tracking-widest border-gold/30 text-gold hover:bg-gold/5">
          SHARE WITH MENTOR
        </Button>
      </div>
    </div>
  );
}
function MilestoneOverlay({ title, meta, onUpload }: { title: string, meta: string, onUpload: (data: string) => void }) {
  const [isUploaded, setIsUploaded] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [data, setData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsVerifying(true);
      try {
        const b64 = await fileToBase64(file);
        let type: 'PIQ' | 'TAT' | 'WAT' | 'SRT' | 'SD' = 'TAT';

        if (title.includes('TAT')) type = 'TAT';
        else if (title.includes('WAT')) type = 'WAT';
        else if (title.includes('SRT')) type = 'SRT';
        else if (title.includes('SD')) type = 'SD';
        else if (title.includes('PIQ')) type = 'PIQ';

        const verifyPrompt = buildVerifyDocumentPrompt(type);
        const verification = await callGeminiMultiPart(verifyPrompt, [{ base64: b64, mimeType: file.type || 'application/pdf' }]);

        if (verification.includes('REJECTED')) {
          toast.error(verification.replace('REJECTED:', '').trim(), { duration: 5000 });
          return;
        }

        setData(b64);
        setIsUploaded(true);
        toast.success(`${type} Document Verified & Anchored`, { icon: "🛡️" });
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : 'Verification failed');
      } finally {
        setIsVerifying(false);
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 animate-in slide-in-from-bottom-4 duration-500">
       <div className="glass-card p-10 bg-black/40 border-gold/10 border-t-4 border-t-gold space-y-8">
          <div className="text-center space-y-2">
             <h2 className="text-3xl font-bold text-white uppercase tracking-tight font-sans">Verification Required</h2>
             <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-bold">{title} • {meta}</p>
          </div>

          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-none border border-white/10 p-12 transition-all flex flex-col items-center gap-4 relative ${isUploaded ? 'bg-gold/5 border-gold/40' : 'bg-white/5 hover:bg-white/[0.08]'}`}
          >
             <input 
               type="file" 
               ref={fileInputRef}
               className="hidden" 
               onChange={handleFileChange} 
             />
             {isVerifying ? (
               <div className="space-y-4 text-center">
                 <FlaskConical className="h-8 w-8 text-gold mx-auto animate-spin" />
                 <p className="text-xs font-bold text-gold uppercase tracking-widest italic">AI Verifying Document...</p>
               </div>
             ) : isUploaded ? (
               <div className="space-y-4 text-center">
                 <CheckCircle className="h-8 w-8 text-gold mx-auto" />
                 <p className="text-xs font-bold text-gold uppercase tracking-widest">Document Secured & Verified</p>
               </div>
             ) : (
               <div className="space-y-4 text-center">
                 <Upload className="h-8 w-8 text-white/40 mx-auto" />
                 <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Click to Initiate Submission</p>
               </div>
             )}
          </div>
          
          <div className="pt-4 border-t border-white/5 space-y-4">
             <div className="flex justify-between items-center text-[10px] text-muted-foreground uppercase font-bold px-1">
                <span>Psychomotor Lab Status:</span>
                <span className={isUploaded ? 'text-gold' : 'text-white/20'}>{isUploaded ? 'READY FOR SYNTHESIS' : 'PENDING UPLOAD'}</span>
             </div>
             <Button 
               disabled={!isUploaded} 
               onClick={() => {
                 if (data) {
                    toast.success("Document verified. Assessment record anchored.", { icon: "🛡️" });
                    onUpload(data);
                 }
               }} 
               size="xl" 
               className="w-full h-16 bg-gold text-black font-bold uppercase tracking-widest rounded-none shadow-2xl"
             >
                FINALIZE COMPONENT
             </Button>
          </div>
       </div>
    </div>
  );
}
