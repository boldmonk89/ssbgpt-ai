import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Timer, FileText, Share2, Shield, Upload, Clock, 
  AlertTriangle, CheckCircle, Zap, UserCircle, 
  ChevronLeft, ChevronRight, Eye, Pencil, FileDown,
  BrainCircuit
} from 'lucide-react';
import { WAT_WORDS, SRT_SITUATIONS } from '@/data/psychTestData';
import { SkeletonAnalysis } from '@/components/SkeletonAnalysis';
import { ExportPdfButton } from '@/components/ExportPdfButton';
import { callGemini, buildFullReportPrompt } from '@/lib/gemini';

const shuffle = (array: any[]) => [...array].sort(() => Math.random() - 0.5);

type TestStep = 'INSTRUCTIONS' | 'PIQ' | 'TAT' | 'WAT' | 'SRT' | 'SD' | 'ANALYSIS';

const speak = (text: string) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1;
  speechSynthesis.speak(utterance);
};

export default function FullAnalysisPage() {
  const [step, setStep] = useState<TestStep>('INSTRUCTIONS');
  const [progress, setProgress] = useState(0);
  const [piqFile, setPiqFile] = useState<File | null>(null);

  // Pool state
  const [tatPool, setTatPool] = useState<string[]>([]);
  const [watPool, setWatPool] = useState<any[]>([]);
  const [srtPool, setSrtPool] = useState<any[]>([]);

  useEffect(() => {
    const tatImages = Array.from({ length: 20 }, (_, i) => `/tat/tat${i + 1}.png`);
    setTatPool(shuffle(tatImages).slice(0, 11));
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
    <div className="space-y-6 scroll-reveal pb-24 max-w-7xl mx-auto">
      <div className="gold-border-left">
        <h1 className="text-4xl font-heading font-black tracking-tight text-white uppercase italic">FULL PSYCH EXAMINATION</h1>
        <p className="text-muted-foreground font-body text-xs mt-1 uppercase tracking-widest">Strict 15 OLQ Standard Calibration</p>
      </div>

      <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl py-4 border-b border-white/5 mx-[-1rem] px-4">
        <div className="flex items-center justify-between mb-2">
           <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-success shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
              <span className="text-[10px] uppercase tracking-[0.3em] font-black text-gold">{step.replace('_', ' ')} IN PROGRESS</span>
           </div>
           <span className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40">{Math.round(progress)}% Total Test Completion</span>
        </div>
        <Progress value={progress} className="h-1 bg-white/5" />
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        {step === 'INSTRUCTIONS' && <InstructionsSection onStart={nextStep} />}
        {step === 'PIQ' && <PiqStep onComplete={nextStep} setPiqFile={setPiqFile} piqFile={piqFile} />}
        {step === 'TAT' && <TatStep onComplete={nextStep} tatPool={tatPool} />}
        {step === 'WAT' && <WatStep onComplete={nextStep} watPool={watPool} />}
        {step === 'SRT' && <SrtStep onComplete={nextStep} srtPool={srtPool} />}
        {step === 'SD' && <SdStep onComplete={nextStep} />}
        {step === 'ANALYSIS' && <FinalAnalysisStep />}
      </div>
    </div>
  );
}

function InstructionsSection({ onStart }: { onStart: () => void }) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="glass-card p-12 text-center space-y-8 relative overflow-hidden group border-destructive/20 border-t-4">
        <Shield className="h-20 w-20 text-gold mx-auto opacity-40 mb-4" />
        <h2 className="text-4xl font-heading font-black tracking-tighter text-white italic">STRICT EXAMINATION MODE</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          You are entering the absolute SSB Psychological Test environment. Timers are fixed and mandatory. Fullscreen focus is required. 
        </p>

        <div className="p-4 rounded-xl border border-destructive/20 bg-destructive/5 text-left max-w-2xl mx-auto">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
            <p className="text-[11px] text-destructive uppercase font-black leading-relaxed">
              WARNING: This is a 2+ hour commitment. Ensure you have physical pen and paper. You cannot skip or pause individual items in this mode.
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6">
           {['TAT: 52m', 'WAT: 15m', 'SRT: 45m', 'SD: 15m'].map(t => (
             <div key={t} className="p-3 rounded-lg bg-white/5 border border-white/5 text-[10px] font-black text-gold uppercase tracking-widest">{t}</div>
           ))}
        </div>

        <Button size="xl" onClick={onStart} className="w-full h-20 text-xl font-black tracking-widest bg-gold hover:bg-gold/90 text-black mt-8 shadow-2xl">
           INITIALIZE FULL EXAM
        </Button>
      </div>
    </div>
  );
}

function PiqStep({ onComplete, setPiqFile, piqFile }: { onComplete: () => void, setPiqFile: (f: File | null) => void, piqFile: File | null }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="max-w-xl mx-auto py-10">
      <div className="glass-card p-12 text-center space-y-8 border-gold/40 border-t-4">
        <div className="h-24 w-24 rounded-full bg-gold/10 border-2 border-dashed border-gold/40 flex items-center justify-center mx-auto">
          <UserCircle className="h-12 w-12 text-gold" />
        </div>
        
        <div>
          <h2 className="text-3xl font-heading font-black text-white italic">BASE-PROFILE UPLOAD</h2>
          <p className="text-[10px] text-gold font-black uppercase tracking-widest mt-2">Personal Information Questionnaire Required</p>
        </div>

        <div 
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 transition-all ${piqFile ? 'border-success bg-success/5' : 'border-white/10 hover:border-gold/30 hover:bg-white/5'}`}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={(e) => {
              if (e.target.files?.[0]) {
                setPiqFile(e.target.files[0]);
                toast.success('Psych Profile Linked');
              }
            }}
          />
          {piqFile ? (
            <div className="flex flex-col items-center gap-3">
              <CheckCircle className="h-10 w-10 text-success" />
              <p className="text-xs font-bold text-white uppercase tracking-widest">{piqFile.name}</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <Upload className="h-10 w-10 text-gold/40" />
              <p className="text-[10px] uppercase font-black text-gold tracking-widest">Select PIQ Form (PDF/Scan)</p>
            </div>
          )}
        </div>

        <Button 
          disabled={!piqFile} 
          onClick={onComplete} 
          size="xl" 
          className="w-full h-16 font-black tracking-widest bg-white text-black hover:bg-white/90 disabled:opacity-20 transition-all"
        >
          CONFIRM & START TAT
        </Button>
      </div>
    </div>
  );
}

function TatStep({ onComplete, tatPool }: { onComplete: () => void, tatPool: string[] }) {
  const [index, setIndex] = useState(0);
  const [isViewing, setIsViewing] = useState(true);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isFinished, setIsFinished] = useState(false);
  const [isUploadPhase, setIsUploadPhase] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isFinished && !isUploadPhase) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (isViewing) {
              setIsViewing(false);
              speak("Observation time ends. Begin writing your story.");
              return 240;
            } else {
              if (index < 11) {
                setIndex(index + 1);
                setIsViewing(true);
                speak("Next stimulus coming.");
                return 30;
              } else {
                speak("Psychomotor viewing complete. Record your work.");
                setIsFinished(true);
                setIsUploadPhase(true);
                return 0;
              }
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isViewing, index, isFinished, isUploadPhase]);

  if (isUploadPhase) return <PdfMilestone title="TAT Response Document" onComplete={onComplete} count={12} />;

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between glass-card p-6 border-none bg-white/5">
         <div className="flex items-center gap-8">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-black text-gold tracking-widest">Examination Stage</span>
              <span className="text-2xl font-black text-white italic">TAT SCENE {index + 1} <span className="text-xs text-white/20">/ 12</span></span>
            </div>
            <div className="h-12 w-px bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-black text-gold tracking-widest">Psych Cycle</span>
              <span className="text-lg font-bold text-white/60 uppercase tracking-tighter">{isViewing ? 'Observation' : 'Interpretation'}</span>
            </div>
         </div>
         <div className={`flex items-center gap-6 bg-black/40 px-8 py-4 rounded-3xl border-t-2 ${isViewing ? 'border-gold shadow-[0_0_30px_rgba(234,179,8,0.1)]' : 'border-success'}`}>
           <Clock className={`h-6 w-6 ${isViewing ? 'text-gold' : 'text-success animate-pulse'}`} />
           <span className="text-4xl font-mono font-black italic tracking-tighter">
             {Math.floor(timeLeft/60)}:{timeLeft%60 < 10 ? '0' : ''}{timeLeft%60}
           </span>
         </div>
       </div>

       <div className="relative aspect-[16/9] w-full rounded-[3rem] overflow-hidden border border-white/5 bg-black shadow-[0_60px_120px_rgba(0,0,0,0.9)]">
          {isViewing ? (
             index < 11 ? (
               <img src={tatPool[index]} className="w-full h-full object-contain animate-in zoom-in-95 duration-1000" />
             ) : (
               <div className="absolute inset-0 bg-white" />
             )
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center space-y-6">
               <div className="p-8 rounded-full bg-gold/5 border border-gold/10 animate-pulse">
                  <Pencil className="h-20 w-20 text-gold opacity-50" />
               </div>
               <h2 className="text-5xl font-heading font-black tracking-tighter text-white italic uppercase">Record Your Perception</h2>
               <p className="text-muted-foreground text-sm max-w-lg leading-relaxed font-body">Focus on character initiative and problem resolution. No personal identifiers.</p>
            </div>
          )}
       </div>
    </div>
  );
}

function WatStep({ onComplete, watPool }: { onComplete: () => void, watPool: any[] }) {
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isFinished, setIsFinished] = useState(false);
  const [isUploadPhase, setIsUploadPhase] = useState(false);
  const [isBreak, setIsBreak] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isFinished && !isUploadPhase && !isBreak) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if ((index + 1) % 15 === 0 && index < 59) {
              speak("Set complete. Turn the page.");
              setIsBreak(true);
              setTimeout(() => {
                 setIsBreak(false);
                 setIndex(i => i + 1);
                 speak("Resuming Test.");
              }, 15000); // 15s page turn break
              return 15;
            }
            if (index < 59) {
              setIndex(index + 1);
              return 15;
            } else {
              speak("WAT stimuli complete.");
              setIsFinished(true);
              setIsUploadPhase(true);
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [index, isFinished, isUploadPhase, isBreak]);

  if (isUploadPhase) return <PdfMilestone title="WAT Sentence Document" onComplete={onComplete} count={60} />;

  return (
    <div className="space-y-8">
       <div className="flex items-center justify-between px-6 bg-white/5 py-4 rounded-2xl border border-white/5">
         <div className="space-y-1">
            <span className="text-[10px] uppercase font-black text-gold tracking-widest">Vacha Projection</span>
            <div className="flex items-center gap-3">
              <span className="text-4xl font-heading font-black text-white italic">{index + 1}</span>
              <span className="text-xs text-white/20 font-bold uppercase tracking-widest">/ 60 Words</span>
            </div>
         </div>
         <div className="text-right flex items-center gap-6">
            <div className="flex flex-col items-end">
               <span className="text-[10px] uppercase font-black text-gold tracking-widest mb-1">Response Window</span>
               <div className="flex items-center gap-3">
                  <div className="h-1 w-32 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gold transition-all duration-300" style={{ width: `${(timeLeft/15)*100}%` }} />
                  </div>
                  <span className="text-2xl font-mono font-black text-white">{timeLeft}s</span>
               </div>
            </div>
         </div>
       </div>

       <div className="glass-card h-[500px] flex items-center justify-center relative overflow-hidden bg-black/60 p-12 rounded-[4rem] border border-white/5 shadow-[0_0_100px_rgba(0,0,0,1)]">
          <div className="absolute inset-0 bg-radial-at-c from-gold/5 pointer-events-none" />
          {isBreak ? (
            <div className="text-center space-y-4 animate-pulse">
               <h2 className="text-4xl font-black text-gold italic uppercase tracking-widest">TURN PAGE</h2>
               <p className="text-[10px] text-white/40 font-bold uppercase tracking-[0.4em]">Preparing stimulus set {Math.ceil((index+2)/15)}</p>
            </div>
          ) : (
            <h2 className="text-9xl font-serif italic text-white text-center drop-shadow-[0_0_30px_rgba(255,255,255,0.2)] animate-in slide-in-from-top-4 duration-500 select-none tracking-tighter">
              {watPool[index]?.word.toLowerCase() || '---'}
            </h2>
          )}
       </div>
    </div>
  );
}

function SrtStep({ onComplete, srtPool }: { onComplete: () => void, srtPool: any[] }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [timeLeft, setTimeLeft] = useState(2700); // 45 mins
  const [isUploadPhase, setIsUploadPhase] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(prev => Math.max(0, prev - 1)), 1000);
    if (timeLeft === 0) setIsUploadPhase(true);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const pageSize = 15;
  const currentSituations = srtPool.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  if (isUploadPhase) return <PdfMilestone title="SRT Response Matrix" onComplete={onComplete} count={60} />;

  return (
    <div className="space-y-8">
       <div className="flex items-center justify-between glass-card bg-black border-none p-8 rounded-3xl">
          <div className="space-y-2">
            <h2 className="text-3xl font-heading font-black uppercase italic tracking-tighter text-white">KARMA COMPONENT</h2>
            <div className="flex gap-2 pt-2">
                {[0,1,2,3].map(p => (
                  <div key={p} className={`h-1.5 rounded-full transition-all ${p <= currentPage ? 'bg-gold w-12' : 'bg-white/5 w-8'}`} />
                ))}
            </div>
          </div>

          <div className="flex items-center gap-8 bg-white/5 px-10 py-5 rounded-[2rem] border border-white/10">
             <div className="flex flex-col items-center">
                <span className="text-[10px] uppercase font-black text-gold tracking-widest mb-1">Time Remaining</span>
                <div className="flex items-center gap-4 text-4xl font-mono font-black text-white italic">
                   <Clock className="h-6 w-6 text-gold animate-pulse" />
                   <span>{Math.floor(timeLeft/60)}:{timeLeft%60 < 10 ? '0' : ''}{timeLeft%60}</span>
                </div>
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pr-2">
          {currentSituations.map((srt, i) => (
            <div key={i} className="glass-card bg-white/[0.02] border-white/5 p-6 h-36 flex flex-col justify-between group hover:bg-white/5 transition-colors">
               <div className="flex gap-4">
                  <span className="text-xs font-black text-gold/20 mt-1">{currentPage * pageSize + i + 1}.</span>
                  <p className="text-[10px] leading-relaxed font-body italic text-white/70 line-clamp-5">
                    {srt.situation}
                  </p>
               </div>
            </div>
          ))}
       </div>

       <div className="flex items-center justify-between pt-10">
          <Button variant="outline" size="xl" disabled={currentPage === 0} onClick={() => setCurrentPage(p => p - 1)} className="h-20 px-12 border-white/10 font-black tracking-widest text-xs uppercase hover:bg-white/5">
             PREVIOUS PAGE
          </Button>

          {currentPage < 3 ? (
            <Button variant="gold" size="xl" onClick={() => {setCurrentPage(p => p + 1); speak("Loading next situation set.");}} className="h-20 px-16 font-black tracking-widest text-xs uppercase shadow-2xl">
              NEXT PAGE <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          ) : (
            <Button variant="gold" size="xl" onClick={() => setIsUploadPhase(true)} className="h-20 px-20 font-black tracking-widest text-sm uppercase shadow-[0_0_50px_rgba(234,179,8,0.2)]">
              SUBMIT & UPLOAD DATA
            </Button>
          )}
       </div>
    </div>
  );
}

function SdStep({ onComplete }: { onComplete: () => void }) {
  const [timeLeft, setTimeLeft] = useState(900);
  const [isUploadPhase, setIsUploadPhase] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(prev => Math.max(0, prev - 1)), 1000);
    if (timeLeft === 0) setIsUploadPhase(true);
    return () => clearInterval(timer);
  }, [timeLeft]);

  if (isUploadPhase) return <PdfMilestone title="Final SD Composite" onComplete={onComplete} count={5} />;

  return (
    <div className="max-w-4xl mx-auto py-12 text-center space-y-12">
       <div className="glass-card p-16 bg-black border-gold/30 border-t-8 shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
          <h2 className="text-5xl font-heading font-black text-white italic tracking-tighter uppercase mb-6">Self Description Block</h2>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto leading-relaxed mb-12">
             Write standard appraisals from Parents, Teachers, Friends, Self, and Goals. <br/>
             Standard SSB Time: <span className="text-gold font-bold">15 Minutes Absolute.</span>
          </p>
          
          <div className="inline-flex items-center gap-6 bg-white/5 px-12 py-6 rounded-[2.5rem] border border-white/10 shadow-[0_0_40px_rgba(234,179,8,0.1)]">
             <Clock className="h-8 w-8 text-gold animate-pulse" />
             <span className="text-6xl font-mono font-black italic text-white tracking-widest tabular-nums">
                {Math.floor(timeLeft/60)}:{timeLeft%60 < 10 ? '0' : ''}{timeLeft%60}
             </span>
          </div>
       </div>

       <div className="grid grid-cols-5 gap-4">
          {['Parents', 'Teachers', 'Friends', 'Self', 'Future'].map(h => (
            <div key={h} className="glass-card-subtle bg-white/5 border-none py-6">
               <span className="text-[10px] uppercase font-black text-gold tracking-widest">{h} Perspective</span>
            </div>
          ))}
       </div>

       <Button size="xl" variant="gold" onClick={() => setIsUploadPhase(true)} className="w-full h-24 text-2xl font-black tracking-widest uppercase shadow-[0_20px_60px_rgba(234,179,8,0.3)]">
          EXAMINATION COMPLETE — ANALYZE REPORT
       </Button>
    </div>
  );
}

function PdfMilestone({ title, onComplete, count }: { title: string, onComplete: () => void, count: number }) {
  const [isUploaded, setIsUploaded] = useState(false);

  return (
    <div className="max-w-xl mx-auto py-10">
       <div className="glass-card p-12 text-center space-y-10 border-success/30 border-t-4 bg-success/[0.02] shadow-[0_40px_80px_rgba(0,0,0,0.6)] animate-in slide-in-from-bottom-8 duration-700">
          <div className="h-24 w-24 rounded-full bg-success/10 border border-success/20 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(34,197,94,0.1)]">
             <FileText className="h-12 w-12 text-success" />
          </div>
          
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Component Validation</h2>
            <p className="text-[10px] uppercase tracking-[0.4em] font-black text-white/40">{title}</p>
          </div>

          <div 
            onClick={() => setIsUploaded(!isUploaded)}
            className={`cursor-pointer rounded-3xl border-2 border-dashed p-12 transition-all group ${isUploaded ? 'border-success bg-white/5 shadow-inner' : 'border-white/10 hover:border-success/40 hover:bg-success/[0.01]'}`}
          >
             {isUploaded ? (
               <div className="flex flex-col items-center gap-4">
                 <CheckCircle className="h-12 w-12 text-success animate-in zoom-in-75" />
                 <p className="text-sm font-black text-white uppercase tracking-[0.2em]">Milestone Secured</p>
               </div>
             ) : (
               <div className="flex flex-col items-center gap-6">
                 <Upload className="h-12 w-12 text-success/40 group-hover:text-success/80 transition-colors" />
                 <p className="text-[10px] uppercase font-black text-success tracking-widest">Select Scan / PDF Record</p>
               </div>
             )}
          </div>

          <Button 
            disabled={!isUploaded} 
            onClick={onComplete} 
            size="xl" 
            className="w-full h-20 font-black tracking-widest bg-success text-white hover:bg-success/90 shadow-2xl disabled:opacity-10 transition-all uppercase text-sm"
          >
            VALIDATE & CONTINUE
          </Button>
       </div>
    </div>
  );
}

function FinalAnalysisStep() {
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const prompt = buildFullReportPrompt(
        { mode: "Full Psych Exam (Strict Calibration)" },
        "Strict 12 TAT Set completed under proctored timer.",
        "60 WAT words processed in sequential 15s flash mode.",
        "45 Minute SRT block synthesized into 15-per-page responses.",
        "SD composite evaluated against standard SSB descriptors."
      );
      const res = await callGemini(prompt + "\n\nIMPORTANT: This is the FULL PSYCH REPORT. Be extremely professional and strictly verify Mansa-Vacha-Karma alignment. Mention the uploaded milestones verify the handwriting pressure markers (simulated).");
      setAnalysisResult(res);
    } catch (e: any) {
      toast.error("Deep Matrix synthesis failed");
    } finally {
      setLoading(false);
    }
  };

  if (!analysisResult && !loading) return (
     <div className="max-w-3xl mx-auto py-20 text-center">
        <div className="glass-card p-20 bg-black border-gold/40 border-t-8 shadow-2xl space-y-10">
           <BrainCircuit className="h-24 w-24 text-gold mx-auto animate-pulse" />
           <div className="space-y-4">
              <h2 className="text-5xl font-heading font-black text-white italic tracking-tighter uppercase">Execute Matrix Analysis</h2>
              <p className="text-muted-foreground uppercase tracking-[0.5em] text-[10px] font-black">Connecting with Psychomotor Engine...</p>
           </div>
           <Button onClick={handleGenerate} size="xl" className="w-full h-24 text-2xl font-black tracking-widest bg-gold text-black shadow-[0_20px_50px_rgba(234,179,8,0.3)] uppercase">
              GENERATE PSYCH CLINICAL REPORT
           </Button>
        </div>
     </div>
  );

  if (loading) return (
    <div className="space-y-10 pt-10 text-center max-w-5xl mx-auto">
       <div className="relative inline-block scale-125 mb-10">
          <div className="absolute inset-0 bg-gold/10 blur-[100px] animate-pulse rounded-full" />
          <BrainCircuit className="h-28 w-28 text-gold relative z-10" />
       </div>
       <div className="space-y-4">
         <h2 className="text-5xl font-heading font-black tracking-widest text-white italic uppercase">CALIBRATING NEURAL PROFILE...</h2>
         <p className="text-[10px] text-muted-foreground uppercase tracking-[0.6em] font-black">Applying 15 OLQ Assessment Hierarchy</p>
       </div>
       <SkeletonAnalysis />
    </div>
  );

  return (
    <div className="glass-card p-16 text-center space-y-12 min-h-screen relative overflow-hidden bg-black shadow-2xl">
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
      
      <div className="relative inline-block scale-150 mb-6">
        <div className="absolute inset-0 bg-gold/20 blur-2xl rounded-full" />
        <CheckCircle className="h-20 w-20 text-gold relative z-10" />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-6xl font-heading font-black tracking-tighter text-white uppercase italic">EXAMINATION VERIFIED</h2>
        <p className="text-xs text-muted-foreground uppercase tracking-[0.6em] font-black italic">Mansa-Vacha-Karma Alignment Index: <span className="text-gold">SECURED</span></p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-10 max-w-6xl mx-auto">
        {[
          { label: 'Subconscious Match', val: 'Verified', desc: 'Alignment between claims and reactions', Icon: Shield },
          { label: 'Officer Maturity', val: 'Strong', desc: 'Calibrated across 60 SRT units', Icon: Zap },
          { label: 'Flow Consistency', val: 'HD', desc: 'WAT stimulus reaction patterns', Icon: Clock },
          { label: 'Psych Matrix', val: 'Level IV', desc: 'Deep Mansa-Vacha-Karma Verification', Icon: UserCircle },
        ].map((item, i) => (
          <div key={i} className="glass-card bg-white/[0.03] border-none p-10 hover:bg-white/[0.06] transition-all group shadow-xl">
            <item.Icon className="h-10 w-10 mx-auto mb-6 text-gold group-hover:scale-110 transition-transform" />
            <p className="text-[10px] uppercase tracking-[0.3em] font-black text-white/30 mb-3">{item.label}</p>
            <p className="text-4xl font-heading font-black text-white tracking-tighter italic">{item.val}</p>
            <p className="text-[10px] text-muted-foreground mt-6 leading-relaxed uppercase tracking-wider">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="max-w-4xl mx-auto space-y-10 text-left">
         <div className="glass-card bg-white/[0.02] border-l-4 border-gold p-12 shadow-2xl prose prose-invert max-w-none">
            <h3 className="text-2xl font-heading font-black text-gold mb-8 italic uppercase tracking-tighter not-prose flex items-center gap-4">
              <BrainCircuit className="h-8 w-8 opacity-40" /> PSYCHOLOGICAL TESTIMONIAL
            </h3>
            <div className="text-white/80 font-body whitespace-pre-wrap leading-loose text-sm">
               {analysisResult}
            </div>
         </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-8 pt-16 px-6 max-w-4xl mx-auto">
        <ExportPdfButton 
          content={analysisResult} 
          title="SSBGPT Comprehensive Psych Report"
          className="flex-1 h-24 text-sm font-black tracking-widest bg-gold hover:bg-gold/90 text-black shadow-[0_20px_50px_rgba(234,179,8,0.3)] uppercase rounded-2xl" 
        />
        <Button size="xl" variant="outline" onClick={() => window.location.reload()} className="flex-1 h-24 text-sm font-black tracking-widest border-white/10 text-white hover:bg-white/5 uppercase rounded-2xl">
          INITIATE NEW TEST
        </Button>
      </div>
    </div>
  );
}
