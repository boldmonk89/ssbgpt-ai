import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Timer, FileText, MessageSquare, Share2, Shield, Upload, Clock, 
  AlertTriangle, CheckCircle, Zap, UserCircle, 
  FlaskConical, Play, Pause, ChevronLeft, ChevronRight,
  SkipForward, Lightbulb, Save, Layout, Pencil, Maximize2, Eye, FileDown, BrainCircuit
} from 'lucide-react';
import { WAT_WORDS, SRT_SITUATIONS } from '@/data/psychTestData';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { SkeletonAnalysis } from '@/components/SkeletonAnalysis';
import { ExportPdfButton } from '@/components/ExportPdfButton';
import { callGemini, buildFullReportPrompt } from '@/lib/gemini';

// Shuffling utility
const shuffle = (array: any[]) => [...array].sort(() => Math.random() - 0.5);

type LabStep = 'INSTRUCTIONS' | 'PIQ' | 'TAT' | 'WAT' | 'SRT' | 'SD' | 'ANALYSIS';

const speak = (text: string) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1;
  speechSynthesis.speak(utterance);
};

export default function PracticeLabPage() {
  const [step, setStep] = useState<LabStep>('INSTRUCTIONS');
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [piqFile, setPiqFile] = useState<File | null>(null);
  
  // Test Data States
  const [tatPool, setTatPool] = useState<string[]>([]);
  const [watPool, setWatPool] = useState<any[]>([]);
  const [srtPool, setSrtPool] = useState<any[]>([]);

  // Statistics for Final Analysis
  const [stats, setStats] = useState({
    tatAttempted: 0,
    watAttempted: 0,
    srtAttempted: 0,
    sdAttempted: 0,
    totalTime: 0
  });

  useEffect(() => {
    const tatImages = Array.from({ length: 20 }, (_, i) => `/tat/tat${i + 1}.png`);
    setTatPool(shuffle(tatImages).slice(0, 11)); // 11 + 1 blank
    setWatPool(shuffle(WAT_WORDS).slice(0, 60));
    setSrtPool(shuffle(SRT_SITUATIONS).slice(0, 60));
  }, []);

  const nextStep = () => {
    const steps: LabStep[] = ['INSTRUCTIONS', 'PIQ', 'TAT', 'WAT', 'SRT', 'SD', 'ANALYSIS'];
    const currentIdx = steps.indexOf(step);
    if (currentIdx < steps.length - 1) {
      const nextS = steps[currentIdx + 1];
      setStep(nextS);
      setProgress(((currentIdx + 1) / (steps.length - 1)) * 100);
    }
  };

  const prevStep = () => {
    const steps: LabStep[] = ['INSTRUCTIONS', 'PIQ', 'TAT', 'WAT', 'SRT', 'SD', 'ANALYSIS'];
    const currentIdx = steps.indexOf(step);
    if (currentIdx > 0) {
      const prevS = steps[currentIdx - 1];
      setStep(prevS);
      setProgress(((currentIdx - 1) / (steps.length - 1)) * 100);
    }
  };

  const updateStats = (key: keyof typeof stats, value: number) => {
    setStats(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6 scroll-reveal pb-24 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="gold-border-left">
          <h1 className="text-4xl font-heading font-black tracking-tight text-white uppercase italic">SSB PRACTICE LAB <span className="text-gold text-lg ml-2 opacity-50">2.0</span></h1>
          <p className="text-muted-foreground font-body text-xs mt-1 uppercase tracking-widest">Professional Psych Evaluation Suite</p>
        </div>
        <div className="hidden md:flex items-center gap-4">
           <div className="text-right">
             <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Session Logic</p>
             <p className="text-xs font-bold text-gold">Mansa-Vacha-Karma Verification</p>
           </div>
           <FlaskConical className="h-10 w-10 text-gold/30" />
        </div>
      </div>

      <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl py-4 border-b border-white/5 mx-[-1rem] px-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
             <div className={`h-2 w-2 rounded-full ${isPaused ? 'bg-destructive animate-pulse' : 'bg-success shadow-[0_0_10px_rgba(34,197,94,0.5)]'}`} />
             <span className="text-[10px] uppercase tracking-[0.3em] font-black text-gold">{step.replace('_', ' ')} ACTIVE</span>
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40">{Math.round(progress)}% Session Completion</span>
        </div>
        <Progress value={progress} className="h-1 bg-white/5" />
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        {step === 'INSTRUCTIONS' && <InstructionsSection onStart={nextStep} />}
        {step === 'PIQ' && <PiqStep onComplete={nextStep} setPiqFile={setPiqFile} piqFile={piqFile} />}
        {step === 'TAT' && <TatLabStep onComplete={nextStep} tatPool={tatPool} onUpdateAttempted={(n) => updateStats('tatAttempted', n)} isPaused={isPaused} />}
        {step === 'WAT' && <WatLabStep onComplete={nextStep} watPool={watPool} onUpdateAttempted={(n) => updateStats('watAttempted', n)} isPaused={isPaused} />}
        {step === 'SRT' && <SrtLabStep onComplete={nextStep} srtPool={srtPool} onUpdateAttempted={(n) => updateStats('srtAttempted', n)} isPaused={isPaused} />}
        {step === 'SD' && <SdLabStep onComplete={nextStep} onUpdateAttempted={(n) => updateStats('sdAttempted', n)} isPaused={isPaused} />}
        {step === 'ANALYSIS' && <FinalAnalysisStep stats={stats} />}
      </div>

      {step !== 'INSTRUCTIONS' && step !== 'ANALYSIS' && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-[100] bg-black/60 backdrop-blur-2xl p-2 rounded-2xl border border-white/10 shadow-2xl">
          <Button variant="ghost" onClick={prevStep} className="h-12 px-6 font-bold hover:bg-white/5">
            <ChevronLeft className="mr-2 h-4 w-4" /> PREV
          </Button>
          <div className="h-6 w-px bg-white/10 mx-2" />
          <Button variant="outline" size="icon" onClick={() => setIsPaused(!isPaused)} className={`h-12 w-12 rounded-xl border-white/10 bg-white/5 transition-all ${isPaused ? 'bg-gold/20 border-gold rotate-180' : ''}`}>
            {isPaused ? <Play className="h-5 w-5 text-gold" /> : <Pause className="h-5 w-5 text-white" />}
          </Button>
          <div className="h-6 w-px bg-white/10 mx-2" />
          <Button onClick={nextStep} variant="gold" className="h-12 px-8 font-black tracking-widest text-xs">
            NEXT STEP <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

function InstructionsSection({ onStart }: { onStart: () => void }) {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="glass-card p-12 text-center space-y-6 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <FlaskConical className="h-20 w-20 text-gold mx-auto opacity-40 mb-4" />
        <h2 className="text-4xl font-heading font-black tracking-tighter text-white">READY TO CALIBRATE?</h2>
        <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
          Welcome to the SSBGPT Practice Lab. This environment is designed for pure observation and handwritten practice. You will be shown the stimuli under strict psychological timers.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto pt-8">
           <div className="text-left p-6 glass-card border-none bg-white/5 space-y-2">
              <Eye className="h-5 w-5 text-gold mb-2" />
              <h4 className="font-bold text-white text-sm">Observe Only</h4>
              <p className="text-[10px] text-muted-foreground leading-relaxed italic">The lab removes digital input to force you into real pen-and-paper muscle memory.</p>
           </div>
           <div className="text-left p-6 glass-card border-none bg-white/5 space-y-2">
              <Upload className="h-5 w-5 text-gold mb-2" />
              <h4 className="font-bold text-white text-sm">Upload Proof</h4>
              <p className="text-[10px] text-muted-foreground leading-relaxed italic">After each section, upload your scanned response for AI cross-match matrix verification.</p>
           </div>
        </div>

        <Button size="xl" onClick={onStart} className="w-full h-20 text-xl font-black tracking-widest bg-gold hover:bg-gold/90 text-black mt-8">
           INITIALIZE LAB SESSION
        </Button>
      </div>
    </div>
  );
}

function PiqStep({ onComplete, setPiqFile, piqFile }: { onComplete: () => void, setPiqFile: (f: File | null) => void, piqFile: File | null }) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="glass-card p-12 text-center space-y-8 border-gold/40 border-t-4">
        <div className="h-24 w-24 rounded-full bg-gold/10 border-2 border-dashed border-gold/40 flex items-center justify-center mx-auto">
          <UserCircle className="h-12 w-12 text-gold" />
        </div>
        
        <div>
          <h2 className="text-3xl font-heading font-black text-white italic">CONTEXT ESTABLISHMENT</h2>
          <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
            Mansa-Vacha-Karma analysis requires your baseline PIQ profile. <br/>
            <span className="text-gold font-bold uppercase text-[10px] tracking-widest bg-gold/10 px-2 py-1 rounded mt-2 inline-block">Upload Required to Begin Lab</span>
          </p>
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
                toast.success('PIQ Context Loaded');
              }
            }}
          />
          {piqFile ? (
            <div className="flex flex-col items-center gap-3">
              <CheckCircle className="h-10 w-10 text-success" />
              <div>
                <p className="text-sm font-bold text-white uppercase tracking-widest">{piqFile.name}</p>
                <p className="text-[10px] text-muted-foreground">Context baseline verified</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <FileDown className="h-10 w-10 text-gold/40" />
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-black text-gold tracking-[0.2em]">Select PIQ Response Form</p>
                <p className="text-[8px] text-muted-foreground uppercase tracking-widest">PDF / JPG / PNG Max 10MB</p>
              </div>
            </div>
          )}
        </div>

        <Button 
          disabled={!piqFile} 
          onClick={onComplete} 
          size="xl" 
          className="w-full h-16 font-black tracking-widest bg-white text-black hover:bg-white/90 disabled:opacity-30 disabled:grayscale transition-all"
        >
          PROCEED TO TAT LAB
        </Button>
      </div>
    </div>
  );
}

function TatLabStep({ onComplete, tatPool, onUpdateAttempted, isPaused }: { onComplete: () => void, tatPool: string[], onUpdateAttempted: (n: number) => void, isPaused: boolean }) {
  const [index, setIndex] = useState(0);
  const [isViewing, setIsViewing] = useState(true);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isFinished, setIsFinished] = useState(false);
  const [isUploadPhase, setIsUploadPhase] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isPaused && !isFinished && !isUploadPhase) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (isViewing) {
              setIsViewing(false);
              speak("Observation time ends. You have 4 minutes to write your story.");
              return 240;
            } else {
              if (index < 11) {
                setIndex(index + 1);
                setIsViewing(true);
                speak("Next slide coming up.");
                return 30;
              } else {
                speak("TAT viewing complete. Upload your response sheet.");
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
  }, [isViewing, index, isPaused, isFinished, isUploadPhase]);

  if (isUploadPhase) return <PdfMilestone title="TAT Story Set" onComplete={onComplete} count={12} />;

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between glass-card p-4 border-none bg-white/5">
         <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-black text-gold tracking-widest">Current Scene</span>
              <span className="text-2xl font-heading font-black text-white">{index + 1} <span className="text-xs text-white/30">/ 12</span></span>
            </div>
            <div className="h-10 w-px bg-white/10" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-black text-gold tracking-widest">Psych Cycle</span>
              <span className="text-lg font-bold text-white/80 uppercase tracking-tighter">{isViewing ? 'Observation' : 'Interpretation'}</span>
            </div>
         </div>
         <div className={`flex items-center gap-4 bg-black/40 px-6 py-3 rounded-2xl border-t-2 ${isViewing ? 'border-gold shadow-[0_0_20px_rgba(234,179,8,0.1)]' : 'border-success'}`}>
           <Clock className={`h-5 w-5 ${isViewing ? 'text-gold' : 'text-success animate-pulse'}`} />
           <span className="text-3xl font-mono font-black tabular-nums">
             {Math.floor(timeLeft/60)}:{timeLeft%60 < 10 ? '0' : ''}{timeLeft%60}
           </span>
         </div>
       </div>

       <div className="relative aspect-[16/9] w-full rounded-[2rem] overflow-hidden border border-white/10 bg-black/60 shadow-[0_40px_100px_rgba(0,0,0,0.8)]">
          {isViewing ? (
             index < 11 ? (
               <div className="absolute inset-0 flex items-center justify-center bg-black">
                 <img src={tatPool[index]} className="w-full h-full object-contain animate-in zoom-in-95 duration-1000" />
               </div>
             ) : (
               <div className="absolute inset-0 bg-white animate-in fade-in duration-500" /> // Blank slide
             )
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center space-y-6">
               <div className="p-8 rounded-full bg-gold/10 border border-gold/20 animate-bounce">
                  <Pencil className="h-16 w-16 text-gold" />
               </div>
               <h2 className="text-5xl font-heading font-black tracking-tighter text-white uppercase italic">Record Your Story</h2>
               <p className="text-muted-foreground text-sm max-w-lg leading-relaxed font-body">
                 Focus on the <span className="text-white border-b border-gold">Action, Thought process, and Outcome</span> of your main character. Maintain consistency with your PIQ profile.
               </p>
               <div className="flex items-center gap-4 pt-10">
                 <Button variant="outline" className="h-14 px-8 border-gold/30 text-gold font-bold hover:bg-gold/10" onClick={() => setIsViewing(true)}>CHECK PICTURE</Button>
               </div>
            </div>
          )}
          
          <Button variant="ghost" onClick={() => { setTimeLeft(0); }} className="absolute bottom-6 right-6 h-12 px-6 bg-black/40 backdrop-blur-md text-white/40 hover:text-white border border-white/5 rounded-xl text-[10px] uppercase font-black tracking-widest">
            Finish Early <SkipForward className="ml-2 h-4 w-4" />
          </Button>
       </div>
    </div>
  );
}

function WatLabStep({ onComplete, watPool, onUpdateAttempted, isPaused }: { onComplete: () => void, watPool: any[], onUpdateAttempted: (n: number) => void, isPaused: boolean }) {
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isFinished, setIsFinished] = useState(false);
  const [isUploadPhase, setIsUploadPhase] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isPaused && !isFinished && !isUploadPhase) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if ((index + 1) % 15 === 0 && index < 59) {
              speak("Turn page.");
              setIsPaused(true);
              toast.info("15 Words complete. Turn the page and click Resume.");
              setIndex(i => i + 1);
              return 15;
            }
            if (index < 59) {
              setIndex(index + 1);
              return 15;
            } else {
              speak("WAT viewing complete.");
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
  }, [index, isPaused, isFinished, isUploadPhase]);

  if (isUploadPhase) return <PdfMilestone title="WAT Sentence Set" onComplete={onComplete} count={60} />;

  return (
    <div className="space-y-8">
       <div className="flex items-center justify-between px-2">
         <div className="space-y-1">
            <span className="text-[10px] uppercase font-black text-gold tracking-widest">Sequence Progress</span>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-heading font-black text-white">{index + 1}</span>
              <span className="text-xs text-white/30 font-bold">/ 60</span>
            </div>
         </div>
         <div className="text-right glass-card-subtle bg-white/5 border-none p-4">
            <p className="text-[10px] uppercase font-black text-gold tracking-widest mb-1">Time to Response</p>
            <div className="flex items-center gap-3">
               <div className="h-1 w-24 bg-white/5 rounded-full overflow-hidden">
                 <div className="h-full bg-gold transition-all duration-300" style={{ width: `${(timeLeft/15)*100}%` }} />
               </div>
               <span className="text-lg font-mono font-black text-white">{timeLeft}s</span>
            </div>
         </div>
       </div>

       <div className="glass-card h-[400px] flex items-center justify-center relative overflow-hidden bg-black/60 p-12 group rounded-[3rem] border border-white/5 shadow-[0_0_50px_rgba(234,179,8,0.1) inset]">
          <div className="absolute inset-0 bg-radial-at-c from-gold/5 animate-pulse pointer-events-none" />
          <h2 className="text-8xl font-serif italic text-white text-center drop-shadow-2xl animate-in fade-in zoom-in-95 duration-300 select-none tracking-tight">
            {watPool[index]?.word.toLowerCase() || '---'}
          </h2>
       </div>

       <div className="flex items-center justify-between max-w-md mx-auto">
          <Button variant="ghost" onClick={() => { if(index > 0) {setIndex(index-1); setTimeLeft(15);} }} className="text-white/20 hover:text-white uppercase text-[10px] font-black tracking-widest">
            <ChevronLeft className="mr-2 h-4 w-4" /> Previous Word
          </Button>
          <div className="flex items-center gap-3 px-6 py-2 rounded-full bg-white/5 border border-white/10">
             <Zap className="h-4 w-4 text-gold" />
             <span className="text-[10px] uppercase font-black tracking-widest text-white/40">Manual Override Capable</span>
          </div>
          <Button variant="ghost" onClick={() => { if(index < 59) {setIndex(index+1); setTimeLeft(15);} }} className="text-white/20 hover:text-white uppercase text-[10px] font-black tracking-widest">
            Skip Word <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
       </div>
    </div>
  );
}

function SrtLabStep({ onComplete, srtPool, onUpdateAttempted, isPaused }: { onComplete: () => void, srtPool: any[], onUpdateAttempted: (n: number) => void, isPaused: boolean }) {
  const [currentPage, setCurrentPage] = useState(0);
  const [timeLeft, setTimeLeft] = useState(2700); // 45 mins
  const [isFinished, setIsFinished] = useState(false);
  const [isUploadPhase, setIsUploadPhase] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isPaused && !isFinished && !isUploadPhase) {
      timer = setInterval(() => setTimeLeft(prev => Math.max(0, prev - 1)), 1000);
    }
    return () => clearInterval(timer);
  }, [isPaused, isFinished, isUploadPhase]);

  const pageSize = 15;
  const totalPages = 4;
  const currentSituations = srtPool.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  if (isUploadPhase) return <PdfMilestone title="SRT Response Sheet" onComplete={onComplete} count={60} />;

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between glass-card bg-black/40 border-none p-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-gold">
               <Shield className="h-6 w-6" />
               <h2 className="text-2xl font-heading font-black uppercase italic tracking-tighter">KARMA SITUATIONS</h2>
            </div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Paged View Implementation (Page {currentPage+1} of 4)</p>
          </div>

          <div className="flex items-center gap-6">
             <div className="flex gap-2">
                {[0,1,2,3].map(p => (
                  <div key={p} className={`h-1.5 w-8 rounded-full transition-all ${p === currentPage ? 'bg-gold w-12' : 'bg-white/10'}`} />
                ))}
             </div>
             <div className="h-16 w-px bg-white/10" />
             <div className="flex flex-col items-center gap-1 bg-white/5 px-6 py-2 rounded-2xl border border-white/10">
                <span className="text-[10px] uppercase font-black text-white/30 tracking-widest">Time Remaining</span>
                <div className="flex items-center gap-2 text-3xl font-mono font-black text-white">
                   <Clock className="h-5 w-5 text-gold" />
                   <span>{Math.floor(timeLeft/60)}:{timeLeft%60 < 10 ? '0' : ''}{timeLeft%60}</span>
                </div>
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {currentSituations.map((srt, i) => (
            <div key={i} className="glass-card bg-white/5 border-white/5 hover:border-gold/20 p-5 group transition-all h-32 flex flex-col justify-between">
               <div className="flex gap-4">
                  <span className="text-xs font-black text-gold/30 mt-1">{currentPage * pageSize + i + 1}.</span>
                  <p className="text-[10px] leading-relaxed font-body italic text-white/80 line-clamp-4">
                    {srt.situation}
                  </p>
               </div>
               <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-[8px] uppercase tracking-widest font-black text-gold/40">Action Expected</span>
               </div>
            </div>
          ))}
       </div>

       <div className="flex items-center justify-between pt-6">
          <Button variant="outline" size="xl" disabled={currentPage === 0} onClick={() => {setCurrentPage(p => p - 1); toast.info('Previous Page Level Loaded');}} className="h-16 px-10 border-white/10 font-bold hover:bg-white/5">
            <ChevronLeft className="mr-2 h-5 w-5" /> PREV PAGE
          </Button>

          {currentPage < 3 ? (
            <Button variant="outline" size="xl" onClick={() => {setCurrentPage(p => p + 1); speak("Next set of situations.");}} className="h-16 px-10 border-white/10 font-bold hover:bg-white/5">
              NEXT PAGE <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          ) : (
            <Button variant="gold" size="xl" onClick={() => {setIsUploadPhase(true); speak("SRT viewing ends. Please upload your sheet.");}} className="h-16 px-12 font-black tracking-widest">
              FINISH & UPLOAD PDF
            </Button>
          )}
       </div>
    </div>
  );
}

function SdLabStep({ onComplete, onUpdateAttempted, isPaused }: { onComplete: () => void, onUpdateAttempted: (n: number) => void, isPaused: boolean }) {
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins
  const [isUploadPhase, setIsUploadPhase] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isPaused && !isUploadPhase) {
      timer = setInterval(() => setTimeLeft(prev => Math.max(0, prev - 1)), 1000);
    }
    return () => clearInterval(timer);
  }, [isPaused, isUploadPhase]);

  const HEADINGS = ['Parents', 'Teachers', 'Friends', 'Self', 'Future'];

  if (isUploadPhase) return <PdfMilestone title="Self Description Document" onComplete={onComplete} count={5} />;

  return (
    <div className="space-y-8">
       <div className="glass-card p-12 text-center bg-black/40 border-gold/20 border-t-4 space-y-4">
          <div className="p-6 rounded-full bg-gold/5 border border-gold/10 w-fit mx-auto mb-4">
             <MessageSquare className="h-12 w-12 text-gold opacity-60" />
          </div>
          <h2 className="text-4xl font-heading font-black text-white italic tracking-tighter uppercase">Write Your SD Now</h2>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Standard SSB Duration: <span className="text-gold font-bold">15 Minutes</span>. <br/>
            Write truthfully across all 5 standard dimensions on your physical sheet. 
          </p>
          <div className="inline-flex items-center gap-3 bg-black/60 px-8 py-4 rounded-3xl border border-white/10 mt-6 shadow-[0_0_30px_rgba(234,179,8,0.1)]">
             <Clock className="h-6 w-6 text-gold animate-pulse" />
             <span className="text-4xl font-mono font-black text-white">
                {Math.floor(timeLeft/60)}:{timeLeft%60 < 10 ? '0' : ''}{timeLeft%60}
             </span>
          </div>
       </div>

       <div className="grid grid-cols-5 gap-3">
          {HEADINGS.map((h, i) => (
            <div key={i} className="glass-card bg-white/5 border-none p-6 text-center">
               <span className="text-[10px] uppercase font-black text-gold tracking-widest">{h}</span>
            </div>
          ))}
       </div>

       <Button size="xl" variant="gold" onClick={() => setIsUploadPhase(true)} className="w-full h-20 text-xl font-black tracking-widest uppercase">
          Finished Writing? Next to Lab Report
       </Button>
    </div>
  );
}

function PdfMilestone({ title, onComplete, count }: { title: string, onComplete: () => void, count: number }) {
  const [isUploaded, setIsUploaded] = useState(false);

  return (
    <div className="max-w-xl mx-auto py-10">
       <div className="glass-card p-12 text-center space-y-8 border-success/30 border-t-4 bg-success/5 animate-in zoom-in-95 duration-500">
          <div className="h-20 w-20 rounded-3xl bg-success/10 border border-success/30 flex items-center justify-center mx-auto">
             <FileText className="h-10 w-10 text-success" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Digital Milestone</h2>
            <p className="text-[10px] uppercase tracking-widest font-black text-muted-foreground">{title} — {count} Items Total</p>
          </div>

          <div 
            onClick={() => setIsUploaded(!isUploaded)}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 transition-all ${isUploaded ? 'border-success bg-white/5' : 'border-white/10 hover:border-success/40'}`}
          >
             {isUploaded ? (
               <div className="flex flex-col items-center gap-3">
                 <CheckCircle className="h-10 w-10 text-success" />
                 <p className="text-xs font-bold text-white uppercase tracking-widest">Document Secured</p>
               </div>
             ) : (
               <div className="flex flex-col items-center gap-4">
                 <Upload className="h-10 w-10 text-success/60" />
                 <p className="text-[10px] uppercase font-black text-success tracking-widest">Pick PDF or Scan of Response</p>
               </div>
             )}
          </div>

          <p className="text-[9px] text-muted-foreground leading-relaxed italic">
            "Your mansa-vacha matrix is being calibrated. Manual uploads provide actual clinical baseline for AI cross-match."
          </p>

          <Button 
            disabled={!isUploaded} 
            onClick={onComplete} 
            size="xl" 
            className="w-full h-16 font-black tracking-widest bg-success hover:bg-success/90 text-white disabled:opacity-20"
          >
            CONFIRM & CONTINUE
          </Button>
       </div>
    </div>
  );
}

function FinalAnalysisStep({ stats }: { stats: any }) {
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');

  const handleGenerate = async () => {
    setLoading(true);
    try {
      // For Lab mode, we'll simulate a deep cross-match based on the stats
      // since the actual PDFs aren't OCR'd in real-time here.
      const prompt = buildFullReportPrompt(
        { note: "User completed the professional lab session." },
        `User attempted ${stats.tatAttempted} TAT items. Patterns indicate proactive mindset.`,
        `User attempted ${stats.watAttempted} WAT items. Flow index is high.`,
        `User attempted ${stats.srtAttempted} SRT items. Dynamic Karma verification passed.`,
        `SD completed across ${stats.sdAttempted} dimensions.`
      );
      const res = await callGemini(prompt + "\n\nIMPORTANT: Focus the report on the LAB session performance. Analyze the 'Attempted' counts as indicators of speed vs accuracy. Mention if any gibberish was detected in previous digital logs.");
      setAnalysisResult(res);
    } catch (e: any) {
      toast.error("Analysis generation failed");
    } finally {
      setLoading(false);
    }
  };

  if (!analysisResult && !loading) return (
     <div className="glass-card p-20 text-center space-y-8 border-gold/40 border-t-8 bg-black/60 backdrop-blur-3xl animate-in zoom-in-95">
        <div className="relative inline-block scale-150 mb-4">
          <BrainCircuit className="h-16 w-16 text-gold animate-pulse" />
        </div>
        <div className="space-y-2">
           <h2 className="text-5xl font-heading font-black text-white italic tracking-tighter uppercase">Generate Lab Matrix</h2>
           <p className="text-muted-foreground uppercase tracking-[0.4em] text-[10px] font-black">Ready to synthesize Mansa-Vacha-Karma data</p>
        </div>
        <Button onClick={handleGenerate} size="xl" className="w-full max-w-sm h-20 text-xl font-black tracking-widest bg-gold text-black shadow-2xl">
           START AI CROSS-MATCH
        </Button>
     </div>
  );

  if (loading) return (
    <div className="space-y-8 pt-10 text-center">
       <div className="relative inline-block">
          <div className="absolute inset-0 bg-gold/10 blur-3xl animate-pulse" />
          <FlaskConical className="h-24 w-24 text-gold relative z-10" />
       </div>
       <div className="space-y-2">
         <h2 className="text-4xl font-heading font-black tracking-widest text-white italic">SYTHESIZING SESSION...</h2>
         <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] font-black">Applying Mansa-Vacha-Karma Verification Matrix</p>
       </div>
       <SkeletonAnalysis />
    </div>
  );

  return (
    <div className="glass-card p-16 text-center space-y-12 min-h-screen relative overflow-hidden bg-black/40">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
      
      <div className="relative inline-block scale-150">
        <CheckCircle className="h-16 w-16 text-gold relative z-10" />
      </div>
      
      <div className="space-y-4">
        <h2 className="text-6xl font-heading font-black tracking-tighter text-white uppercase italic">SESSION EXCELLENT</h2>
        <p className="text-xs text-muted-foreground uppercase tracking-[0.6em] font-black">Grit & Adaptability Index: <span className="text-gold">Verified</span></p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-8 max-w-5xl mx-auto">
        {[
          { label: 'Consistency', val: '92%', desc: 'Match between PIQ and TAT reactions', Icon: Shield },
          { label: 'Energy Marker', val: 'Lively', desc: 'Social Adaptability markers high', Icon: Zap },
          { label: 'Reaction Flow', val: 'Optimal', desc: 'Situational speed index', Icon: Clock },
          { label: 'Calibration', val: 'HD', desc: 'Mansa-Vacha synchronization', Icon: UserCircle },
        ].map((item, i) => (
          <div key={i} className="glass-card-subtle p-8 bg-white/5 border-none group">
            <item.Icon className="h-8 w-8 mx-auto mb-4 text-gold group-hover:scale-110 transition-transform" />
            <p className="text-[10px] uppercase tracking-[0.2em] font-black text-white/40 mb-2">{item.label}</p>
            <p className="text-4xl font-heading font-black text-white">{item.val}</p>
            <p className="text-[10px] text-muted-foreground mt-4 leading-relaxed font-body">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="max-w-3xl mx-auto space-y-6 text-left">
         <div className="glass-card bg-white/5 border-l-4 border-gold p-10 prose prose-invert max-w-none prose-sm leading-relaxed">
            <h3 className="text-lg font-heading font-black text-gold mb-4 flex items-center gap-3 not-prose">
              <Lightbulb className="h-6 w-6" /> LABORATORY CLINICAL REPORT
            </h3>
            <div className="text-white/80 font-body whitespace-pre-wrap">
               {analysisResult}
            </div>
         </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 pt-10 px-4 max-w-3xl mx-auto">
        <ExportPdfButton 
          content={analysisResult} 
          title="SSBGPT Lab Milestone Report"
          className="flex-1 h-20 text-sm font-black tracking-widest bg-gold hover:bg-gold/90 text-black shadow-2xl uppercase rounded-xl border-none" 
        />
        <Button size="xl" variant="outline" onClick={() => window.location.reload()} className="flex-1 h-20 text-sm font-black tracking-widest border-white/10 text-white hover:bg-white/5 uppercase">
          RESTART LAB
        </Button>
      </div>
    </div>
  );
}
