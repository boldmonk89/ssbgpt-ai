import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Timer, FileText, Share2, Shield, Upload, Clock, 
  AlertTriangle, CheckCircle, Zap, UserCircle, 
  FlaskConical, Play, Pause, ChevronLeft, ChevronRight,
  SkipForward, Lightbulb, Save, Layout
} from 'lucide-react';
import { WAT_WORDS, SRT_SITUATIONS } from '@/data/psychTestData';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { SkeletonAnalysis } from '@/components/SkeletonAnalysis';

// Shuffling utility
const shuffle = (array: any[]) => [...array].sort(() => Math.random() - 0.5);

type LabStep = 'SELECTION' | 'PIQ' | 'TAT' | 'WAT' | 'SRT' | 'SD' | 'ANALYSIS';
type LabMode = 'FULL' | 'TAT' | 'WAT' | 'SRT';

const speak = (text: string) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1;
  speechSynthesis.speak(utterance);
};

export default function PracticeLabPage() {
  const [step, setStep] = useState<LabStep>('SELECTION');
  const [mode, setMode] = useState<LabMode>('FULL');
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  // Test Data States
  const [tatPool, setTatPool] = useState<string[]>([]);
  const [watPool, setWatPool] = useState<any[]>([]);
  const [srtPool, setSrtPool] = useState<any[]>([]);

  useEffect(() => {
    // Standard pool initialization
    const tatImages = Array.from({ length: 20 }, (_, i) => `/tat/tat${i + 1}.png`);
    setTatPool(shuffle(tatImages).slice(0, 11));
    setWatPool(shuffle(WAT_WORDS).slice(0, 60));
    setSrtPool(shuffle(SRT_SITUATIONS).slice(0, 60));
  }, []);

  const startLab = (selectedMode: LabMode) => {
    setMode(selectedMode);
    if (selectedMode === 'FULL') {
      setStep('PIQ');
    } else {
      setStep(selectedMode as LabStep);
    }
  };

  const nextStep = () => {
    const steps: LabStep[] = ['SELECTION', 'PIQ', 'TAT', 'WAT', 'SRT', 'SD', 'ANALYSIS'];
    const currentIdx = steps.indexOf(step);
    if (currentIdx < steps.length - 1) {
      setStep(steps[currentIdx + 1]);
      setProgress(((currentIdx + 1) / (steps.length - 1)) * 100);
    }
  };

  return (
    <div className="space-y-6 scroll-reveal pb-20">
      <div className="gold-border-left">
        <h1 className="text-3xl font-heading font-black tracking-tight">SSB Practice Lab</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">Flexible Testing — Manual Controls — AI Lab Environment</p>
      </div>

      {step !== 'SELECTION' && (
        <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md py-4 border-b border-border/30">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest font-heading font-bold text-gold">{step.replace('_', ' ')} LAB</span>
              {isPaused && <span className="text-[10px] bg-destructive/20 text-destructive px-2 py-0.5 rounded-full font-bold">PAUSED</span>}
            </div>
            <span className="text-[10px] uppercase tracking-widest font-heading font-bold text-muted-foreground">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      )}

      {step === 'SELECTION' && <SelectionSection onStart={startLab} />}
      {step === 'PIQ' && <PiqStep onComplete={nextStep} />}
      {step === 'TAT' && <TatLabStep onComplete={nextStep} tatPool={tatPool} />}
      {step === 'WAT' && <WatLabStep onComplete={nextStep} watPool={watPool} />}
      {step === 'SRT' && <SrtLabStep onComplete={nextStep} srtPool={srtPool} />}
      {step === 'SD' && <SdLabStep onComplete={nextStep} />}
      {step === 'ANALYSIS' && <FinalAnalysisStep />}

      {step !== 'SELECTION' && step !== 'ANALYSIS' && (
        <div className="fixed bottom-6 right-6 flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => setIsPaused(!isPaused)} className="h-12 w-12 rounded-full border-gold/30 bg-background shadow-xl">
            {isPaused ? <Play className="h-5 w-5 text-gold" /> : <Pause className="h-5 w-5 text-gold" />}
          </Button>
          <Button onClick={nextStep} variant="gold" className="rounded-full px-6 shadow-xl h-12 font-bold">
            End Test & Analyze
          </Button>
        </div>
      )}
    </div>
  );
}

function SelectionSection({ onStart }: { onStart: (mode: LabMode) => void }) {
  const modes = [
    { id: 'FULL', title: 'Sequential Mock', desc: 'PIQ to SD in one go with flex controls', icon: Shield },
    { id: 'TAT', title: 'TAT Lab', desc: 'Practice 12 TAT scenes with skip/prev', icon: FileText },
    { id: 'WAT', title: 'WAT Lab', desc: '60 Words with manual navigation', icon: MessageSquare },
    { id: 'SRT', title: 'SRT Lab', desc: 'Focus-view SRT practice', icon: Zap },
  ] as const;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
      {modes.map((m) => (
        <div key={m.id} className="glass-card p-8 group hover:scale-[1.02] transition-all cursor-pointer border-gold/10 hover:border-gold/40" onClick={() => onStart(m.id as LabMode)}>
          <div className="h-14 w-14 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center mb-6 group-hover:glow-gold transition-all">
             <m.icon className="h-7 w-7 text-gold" />
          </div>
          <h2 className="text-xl font-heading font-bold mb-2">{m.title}</h2>
          <p className="text-xs text-muted-foreground leading-relaxed mb-6">{m.desc}</p>
          <Button variant="outline" className="w-full group-hover:bg-gold group-hover:text-background transition-colors border-gold/40 text-gold font-bold">
             Enter Lab
          </Button>
        </div>
      ))}
    </div>
  );
}

function PiqStep({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="glass-card p-10 text-center space-y-6">
      <div className="mx-auto h-20 w-20 rounded-3xl bg-gold/10 border border-gold/20 flex items-center justify-center">
        <UserCircle className="h-10 w-10 text-gold" />
      </div>
      <h2 className="text-2xl font-heading font-bold">Step 1: Universal Context</h2>
      <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
        In Lab mode, PIQ is optional but recommended for a personalized Clinical Report.
      </p>
      <div className="flex flex-col items-center gap-4">
        <Button variant="outline" className="w-full max-w-sm border-dashed border-2 py-8 bg-gold/5 border-gold/30">
          <Upload className="mr-2 h-4 w-4" /> Upload PIQ (Optional)
        </Button>
        <Button onClick={onComplete} className="w-full max-w-sm">Continue to Practice</Button>
      </div>
    </div>
  );
}

function TatLabStep({ onComplete, tatPool }: { onComplete: () => void, tatPool: string[] }) {
  const [index, setIndex] = useState(0);
  const [isViewing, setIsViewing] = useState(true);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isFinished, setIsFinished] = useState(false);
  const [showCoach, setShowCoach] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isFinished) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (isViewing) {
              setIsViewing(false);
              return 240;
            } else {
              if (index < 11) {
                setIndex(index + 1);
                setIsViewing(true);
                return 30;
              } else {
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

  const nextSlide = () => {
    if (index < 11) {
      setIndex(index + 1);
      setIsViewing(true);
      setTimeLeft(30);
    } else {
      setIsFinished(true);
    }
  };

  const prevSlide = () => {
    if (index > 0) {
      setIndex(index - 1);
      setIsViewing(true);
      setTimeLeft(30);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 glass-card p-6 space-y-6 flex flex-col items-center">
        <div className="flex justify-between w-full px-2">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={prevSlide} disabled={index === 0}><ChevronLeft /></Button>
            <span className="text-xs font-heading font-bold text-gold uppercase tracking-widest">SCENE {index + 1} / 12</span>
            <Button variant="ghost" size="icon" onClick={nextSlide} disabled={index === 11}><ChevronRight /></Button>
          </div>
          <div className="flex items-center gap-2 text-gold">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-mono font-bold">{Math.floor(timeLeft/60)}:{timeLeft%60 < 10 ? '0' : ''}{timeLeft%60}</span>
          </div>
        </div>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-border/40 bg-black/40 flex items-center justify-center">
           {isViewing ? (
             index < 11 ? (
               <img src={tatPool[index]} className="w-full h-full object-contain" alt={`TAT ${index + 1}`} />
             ) : (
               <div className="absolute inset-0 bg-white" />
             )
           ) : (
             <div className="text-center p-8">
               <h3 className="text-xl font-heading font-bold text-gold mb-2">WRITING TIME</h3>
               <p className="text-xs text-muted-foreground">Manual controls enabled. Proceed when ready.</p>
             </div>
           )}
        </div>

        <div className="flex items-center gap-4 w-full">
          <Button variant="outline" className="flex-1 border-gold/20" onClick={() => setIsViewing(!isViewing)}>
            {isViewing ? 'Switch to Writing' : 'Back to Picture'}
          </Button>
          <Button variant="outline" className="flex-1 border-gold/20" onClick={nextSlide}>
            <SkipForward className="h-4 w-4 mr-2" /> Skip to Next
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="glass-card p-6 border-gold/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-heading font-bold text-gold flex items-center gap-2">
              <Lightbulb className="h-4 w-4" /> AI Lab Coach
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setShowCoach(!showCoach)} className="text-[10px] uppercase font-bold text-gold">
              {showCoach ? 'Hide' : 'Show'}
            </Button>
          </div>
          {showCoach && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="p-3 rounded-xl bg-gold/5 border border-gold/10">
                 <p className="text-[10px] uppercase tracking-widest font-bold text-gold mb-1">Objective</p>
                 <p className="text-[11px] text-muted-foreground leading-relaxed">TAT measures your 'Apperception'—the meaning you project onto ambiguous scenes.</p>
              </div>
              <div className="p-3 rounded-xl bg-gold/5 border border-gold/10">
                 <p className="text-[10px] uppercase tracking-widest font-bold text-gold mb-1">Coach's Tip</p>
                 <p className="text-[11px] text-muted-foreground leading-relaxed">Focus on a central 'Hero' who solves a problem via effort, not luck.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WatLabStep({ onComplete, watPool }: { onComplete: () => void, watPool: any[] }) {
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [showCoach, setShowCoach] = useState(false);
  const [responses, setResponses] = useState<Record<number, string>>({});

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(prev => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, [index]);

  const nextWord = () => {
    if (index < 59) {
      setIndex(index + 1);
      setTimeLeft(15);
    } else {
      onComplete();
    }
  };

  const prevWord = () => {
    if (index > 0) {
      setIndex(index - 1);
      setTimeLeft(15);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 glass-card min-h-[400px] flex flex-col items-center justify-center space-y-8 relative overflow-hidden p-8">
        <div className="absolute top-4 left-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={prevWord} disabled={index === 0}><ChevronLeft /></Button>
          <span className="text-xs font-heading font-bold text-gold/60 uppercase tracking-widest">WORD {index + 1} / 60</span>
          <Button variant="ghost" size="icon" onClick={nextWord} disabled={index === 59}><ChevronRight /></Button>
        </div>
        
        <div className="absolute top-4 right-4 flex items-center gap-2 text-gold font-mono font-bold">
          <Clock className="h-4 w-4" />
          <span>0:{timeLeft < 10 ? '0' : ''}{timeLeft}</span>
        </div>

        <div className="text-center py-10">
          <h2 className="text-7xl font-heading font-black tracking-tighter text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
            {watPool[index]?.word.toUpperCase() || '---'}
          </h2>
        </div>

        <div className="w-full max-w-md">
           <textarea 
            className="glass-input text-center text-lg italic border-gold/20 h-24"
            placeholder="Type your reaction..."
            value={responses[index] || ''}
            onChange={(e) => setResponses({ ...responses, [index]: e.target.value })}
           />
           <div className="flex justify-between mt-4">
              <Button variant="ghost" size="sm" className="text-[10px] text-muted-foreground uppercase font-bold" onClick={nextWord}>Skip</Button>
              <Button variant="gold" size="sm" className="px-8 font-bold" onClick={nextWord}>Next</Button>
           </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="glass-card p-6 border-gold/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-heading font-bold text-gold flex items-center gap-2">
              <Lightbulb className="h-4 w-4" /> WAT Lab
            </h3>
            <Button variant="ghost" size="sm" onClick={() => setShowCoach(!showCoach)} className="text-[10px] uppercase font-bold text-gold">
              {showCoach ? 'Hide' : 'Show'}
            </Button>
          </div>
          {showCoach && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-2 duration-300">
               <p className="text-[11px] text-muted-foreground leading-relaxed italic">Psychologists track your 'Response Time' here. Rapid, positive reactions are key.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SrtLabStep({ onComplete, srtPool }: { onComplete: () => void, srtPool: any[] }) {
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(2700);
  const [showCoach, setShowCoach] = useState(false);
  const [responses, setResponses] = useState<Record<number, string>>({});

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(prev => Math.max(0, prev - 1)), 1000);
    return () => clearInterval(timer);
  }, []);

  const nextSrt = () => { if (index < 59) setIndex(index + 1); else onComplete(); };
  const prevSrt = () => { if (index > 0) setIndex(index - 1); };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="glass-card p-8 min-h-[300px] flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-gold">Situation Focus {index + 1} / 60</span>
            <div className="flex items-center gap-2 text-gold font-mono font-bold bg-black/40 px-3 py-1 rounded-lg border border-gold/10">
              <Timer className="h-4 w-4" />
              <span>{Math.floor(timeLeft/60)}:{timeLeft%60 < 10 ? '0' : ''}{timeLeft%60}</span>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-xl font-body italic text-foreground leading-relaxed">
              "{srtPool[index]?.situation}"
            </p>
            <textarea 
              className="glass-input h-32 text-sm"
              placeholder="What is your immediate reaction?"
              value={responses[index] || ''}
              onChange={(e) => setResponses({ ...responses, [index]: e.target.value })}
            />
          </div>

          <div className="flex justify-between items-center mt-8">
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={prevSrt} disabled={index === 0}><ChevronLeft className="h-4 w-4 mr-1" /> Prev</Button>
              <Button variant="outline" size="sm" onClick={nextSrt}><ChevronRight className="h-4 w-4 ml-1" /> Next</Button>
            </div>
            <Button variant="ghost" size="sm" className="text-[10px] uppercase font-bold text-muted-foreground" onClick={nextSrt}>Skip</Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="glass-card p-6 border-gold/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-heading font-bold text-gold flex items-center gap-2">
              <Lightbulb className="h-4 w-4" /> SRT Coach
            </h3>
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed italic">SRT tests 'Real-time Reasoning'. Give practical, complete solutions.</p>
        </div>
      </div>
    </div>
  );
}

function SdLabStep({ onComplete }: { onComplete: () => void }) {
  const HEADINGS = [
    'What your Parents think of you',
    'What your Teachers think of you',
    'What your Friends think of you',
    'What YOU think of yourself',
    'Qualities you wish to develop'
  ];

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 border-gold/20 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-bold">Self Description Lab</h2>
          <p className="text-xs text-muted-foreground italic">Prepare each paragraph honestly.</p>
        </div>
        <Button onClick={onComplete} variant="gold" className="px-10">End & Analyze</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {HEADINGS.map((h, i) => (
          <div key={i} className="glass-card p-6 hover:border-gold/30 transition-all group">
            <h3 className="text-xs font-heading font-bold text-gold uppercase mb-3 tracking-widest">{h}</h3>
            <textarea className="glass-input h-32 text-xs" placeholder={`Reflect on ${h}...`} />
          </div>
        ))}
      </div>
    </div>
  );
}

function FinalAnalysisStep() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 2500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return (
    <div className="space-y-6">
       <div className="text-center space-y-2 mb-8">
         <h2 className="text-2xl font-heading font-bold animate-pulse">Generating Lab Report...</h2>
       </div>
       <SkeletonAnalysis />
    </div>
  );

  return (
    <div className="glass-card text-center py-12 space-y-6 stagger-children min-h-screen">
      <div className="relative inline-block">
        <FlaskConical className="h-20 w-20 text-gold relative z-10" />
      </div>
      <h2 className="text-3xl font-heading font-black tracking-tight uppercase tracking-widest">Lab Analysis Complete</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 py-8">
        {[
          { icon: Shield, label: 'Completion', val: '72%', desc: 'Portion of Lab test finished', color: 'text-gold' },
          { icon: Zap, label: 'Authenticity', val: 'High', desc: 'Consistency of responses', color: 'text-success' },
          { icon: Play, label: 'Psych Index', val: 'Stable', desc: 'Predicted Officer Potential', color: 'text-gold' },
          { icon: CheckCircle, label: 'Verification', val: 'Done', desc: 'Mansa alignment check', color: 'text-gold' },
        ].map((item, i) => (
          <div key={i} className="glass-card-subtle p-6 hover:scale-105 transition-all">
            <item.icon className="h-6 w-6 mx-auto mb-3 text-gold" />
            <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">{item.label}</p>
            <p className="text-2xl font-heading font-black text-gold">{item.val}</p>
            <p className="text-[10px] text-muted-foreground/60 mt-2">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-6">
        <Button size="xl" className="flex-1 h-14 text-sm font-black tracking-widest bg-gold hover:bg-gold/90 text-background">
          DOWNLOAD LAB REPORT
        </Button>
      </div>
    </div>
  );
}
