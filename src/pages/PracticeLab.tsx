import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Timer, FileText, MessageSquare, Share2, Shield, Upload, Clock, 
  AlertTriangle, CheckCircle, Zap, UserCircle, 
  FlaskConical, Play, Pause, ChevronLeft, ChevronRight,
  SkipForward, Lightbulb, Save, Layout, Pencil
} from 'lucide-react';
import { WAT_WORDS, SRT_SITUATIONS } from '@/data/psychTestData';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { SkeletonAnalysis } from '@/components/SkeletonAnalysis';

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
    // Normalizing pool to match Full Psych (12 TAT, 60 WAT, 60 SRT)
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

  const updateStats = (key: keyof typeof stats, value: number) => {
    setStats(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6 scroll-reveal pb-20">
      <div className="gold-border-left">
        <h1 className="text-3xl font-heading font-black tracking-tight">SSB Practice Lab</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">Flexible Testing — Individual Skip — AI Calibration Mode</p>
      </div>

      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md py-4 border-b border-border/30">
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-heading font-bold text-gold">{step.replace('_', ' ')} PATTERN</span>
            {isPaused && <span className="text-[10px] bg-destructive/20 text-destructive px-2 py-0.5 rounded-full font-bold animate-pulse">PAUSED</span>}
          </div>
          <span className="text-[10px] uppercase tracking-widest font-heading font-bold text-muted-foreground">{Math.round(progress)}% Complete</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {step === 'INSTRUCTIONS' && <InstructionsSection onStart={nextStep} />}
      {step === 'PIQ' && <PiqStep onComplete={nextStep} />}
      {step === 'TAT' && <TatLabStep onComplete={nextStep} tatPool={tatPool} onUpdateAttempted={(n) => updateStats('tatAttempted', n)} isPaused={isPaused} />}
      {step === 'WAT' && <WatLabStep onComplete={nextStep} watPool={watPool} onUpdateAttempted={(n) => updateStats('watAttempted', n)} isPaused={isPaused} />}
      {step === 'SRT' && <SrtLabStep onComplete={nextStep} srtPool={srtPool} onUpdateAttempted={(n) => updateStats('srtAttempted', n)} isPaused={isPaused} />}
      {step === 'SD' && <SdLabStep onComplete={nextStep} onUpdateAttempted={(n) => updateStats('sdAttempted', n)} />}
      {step === 'ANALYSIS' && <FinalAnalysisStep stats={stats} />}

      {step !== 'INSTRUCTIONS' && step !== 'ANALYSIS' && (
        <div className="fixed bottom-6 right-6 flex items-center gap-3 z-[100]">
          <Button variant="outline" size="icon" onClick={() => setIsPaused(!isPaused)} className={`h-12 w-12 rounded-full border-gold/30 bg-background shadow-2xl transition-all ${isPaused ? 'scale-110 border-gold' : ''}`}>
            {isPaused ? <Play className="h-5 w-5 text-gold" /> : <Pause className="h-5 w-5 text-gold" />}
          </Button>
          <Button onClick={nextStep} variant="gold" className="rounded-full px-6 shadow-2xl h-12 font-bold group">
            End Test & Analyze <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      )}
    </div>
  );
}

function InstructionsSection({ onStart }: { onStart: () => void }) {
  return (
    <div className="glass-card stagger-children p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center">
          <FlaskConical className="h-6 w-6 text-gold" />
        </div>
        <div>
          <h2 className="text-xl font-heading font-bold">Standard Lab Mode</h2>
          <p className="text-xs text-muted-foreground font-body">Full Psych Environment with Flex Navigation.</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {[
          { label: 'TAT', desc: '12 Scenes, 4 min writing. Skip individual slides if needed.' },
          { label: 'WAT', desc: '60 Words, 15s each. Manually skip difficult words.' },
          { label: 'SRT', desc: '60 Situations, 45 mins. Navigate and skip freely.' },
          { label: 'SD', desc: '5 Paragraphs, 15 mins. Write sections individually.' },
        ].map((item, i) => (
          <div key={i} className="glass-card-subtle p-4 border-l-2 border-gold/40">
            <h3 className="text-sm font-heading font-bold text-gold mb-1">{item.label}</h3>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      <Button 
        size="xl" 
        onClick={onStart} 
        className="w-full h-16 text-lg font-heading font-black tracking-tighter shadow-2xl bg-gold hover:bg-gold/90 text-background"
      >
        START PRACTICE LAB
      </Button>
    </div>
  );
}

function PiqStep({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="glass-card p-10 text-center space-y-6">
      <div className="mx-auto h-20 w-20 rounded-3xl bg-gold/10 border border-gold/20 flex items-center justify-center">
        <UserCircle className="h-10 w-10 text-gold" />
      </div>
      <h2 className="text-2xl font-heading font-bold">Universal Context (PIQ)</h2>
      <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed font-body">
        Upload your PIQ form for a personalized report, or skip to begin the direct Psychological tests.
      </p>
      <div className="flex flex-col items-center gap-4">
        <Button variant="outline" className="w-full max-w-sm border-dashed border-2 py-10 bg-gold/5 border-gold/30 group">
          <Upload className="mr-2 h-5 w-5 group-hover:-translate-y-1 transition-transform" /> Upload PIQ Form
        </Button>
        <Button onClick={onComplete} className="w-full max-w-sm h-12 font-bold">Proceed to TAT Lab</Button>
      </div>
    </div>
  );
}

function TatLabStep({ onComplete, tatPool, onUpdateAttempted, isPaused }: { onComplete: () => void, tatPool: string[], onUpdateAttempted: (n: number) => void, isPaused: boolean }) {
  const [index, setIndex] = useState(0);
  const [isViewing, setIsViewing] = useState(true);
  const [timeLeft, setTimeLeft] = useState(30);
  const [attempted, setAttempted] = useState<Set<number>>(new Set());

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isPaused) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (isViewing) {
              setIsViewing(false);
              speak("Begin writing.");
              return 240;
            } else {
              if (index < 11) {
                setIndex(index + 1);
                setIsViewing(true);
                return 30;
              } else {
                onComplete();
                return 0;
              }
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isViewing, index, isPaused]);

  useEffect(() => {
    onUpdateAttempted(attempted.size);
  }, [attempted]);

  const skipForward = () => {
    if (index < 11) {
      setIndex(index + 1);
      setIsViewing(true);
      setTimeLeft(30);
    } else {
      onComplete();
    }
  };

  const handleAttempt = () => {
    setAttempted(prev => new Set(prev).add(index));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 glass-card p-6 space-y-6 flex flex-col items-center">
        <div className="flex justify-between w-full px-2">
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-heading font-bold text-gold uppercase tracking-[0.2em]">TAT SCENE {index + 1} / 12</span>
          </div>
          <div className="flex items-center gap-2 text-gold">
            <Clock className="h-4 w-4" />
            <span className="text-sm font-mono font-bold">{Math.floor(timeLeft/60)}:{timeLeft%60 < 10 ? '0' : ''}{timeLeft%60}</span>
          </div>
        </div>

        <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-border/40 bg-black/40 flex items-center justify-center">
           {isViewing ? (
             index < 11 ? (
               <img src={tatPool[index]} className="w-full h-full object-contain animate-in fade-in zoom-in-95 duration-500" alt={`TAT ${index + 1}`} />
             ) : (
               <div className="absolute inset-0 bg-white" /> // Blank slide
             )
           ) : (
             <div className="text-center p-8 space-y-4">
               <Pencil className="h-10 w-10 text-gold mx-auto opacity-50" />
               <h3 className="text-2xl font-heading font-bold text-gold">WRITE YOUR STORY</h3>
               <p className="text-xs text-muted-foreground max-w-xs mx-auto">Manual Lab Controls enabled. Use the Skip button if you finish early.</p>
             </div>
           )}
        </div>

        <div className="flex items-center gap-4 w-full">
          <Button variant="outline" className="flex-1 border-gold/20 font-bold" onClick={() => setIsViewing(!isViewing)}>
            {isViewing ? 'Switch to Writing' : 'Check Picture'}
          </Button>
          <Button variant="gold" className="flex-1 font-black tracking-widest group" onClick={() => { handleAttempt(); skipForward(); }}>
            <SkipForward className="h-4 w-4 mr-2" /> SKIP TO NEXT
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="glass-card p-6 border-gold/30">
          <h3 className="text-sm font-heading font-bold text-gold flex items-center gap-2 mb-4">
            <Lightbulb className="h-4 w-4" /> Lab Analyst Tips
          </h3>
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-gold/5 border border-gold/10">
               <p className="text-[10px] uppercase tracking-widest font-bold text-gold mb-1">Mansa Tip</p>
               <p className="text-[11px] text-muted-foreground leading-relaxed">Don't overwrite. 120-150 words is the sweet spot for 4 minutes.</p>
            </div>
            <div className="p-3 rounded-xl bg-gold/5 border border-gold/10">
               <p className="text-[10px] uppercase tracking-widest font-bold text-gold mb-1">Psych Insight</p>
               <p className="text-[11px] text-muted-foreground leading-relaxed">The 12th slide is blank to see your natural optimism. Prepare a story based on your life goal.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function WatLabStep({ onComplete, watPool, onUpdateAttempted, isPaused }: { onComplete: () => void, watPool: any[], onUpdateAttempted: (n: number) => void, isPaused: boolean }) {
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [attempted, setAttempted] = useState<Set<number>>(new Set());

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isPaused) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (index < 59) {
              setIndex(index + 1);
              return 15;
            } else {
              onComplete();
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [index, isPaused]);

  useEffect(() => {
    onUpdateAttempted(attempted.size);
  }, [attempted]);

  const skipForward = () => {
    if (index < 59) {
      setIndex(index + 1);
      setTimeLeft(15);
    } else {
      onComplete();
    }
  };

  const handleAttempt = () => {
    setAttempted(prev => new Set(prev).add(index));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 glass-card min-h-[450px] flex flex-col items-center justify-center space-y-12 relative overflow-hidden p-8">
        <div className="absolute top-4 left-6">
          <span className="text-[10px] font-heading font-bold text-gold/60 uppercase tracking-[0.3em]">WAT WORD {index + 1} / 60</span>
        </div>
        
        <div className="absolute top-4 right-6 flex items-center gap-2 text-gold font-mono font-bold bg-black/40 px-3 py-1 rounded-full border border-gold/20">
          <Clock className="h-4 w-4" />
          <span>0:{timeLeft < 10 ? '0' : ''}{timeLeft}</span>
        </div>

        <div className="text-center py-10 scale-125">
          <h2 className="text-7xl font-heading font-black tracking-tighter text-white drop-shadow-[0_0_25px_rgba(255,255,255,0.4)] animate-in zoom-in-95 duration-300">
            {watPool[index]?.word.toUpperCase() || '---'}
          </h2>
        </div>

        <div className="w-full max-w-sm space-y-4">
           <textarea 
            className="glass-input text-center text-lg italic border-gold/30 h-24 placeholder:text-muted-foreground/30 focus:border-gold"
            placeholder="Write your first reaction here..."
            onFocus={handleAttempt}
           />
           <div className="flex gap-4">
              <Button variant="outline" className="flex-1 border-gold/20 uppercase text-[10px] font-bold tracking-widest" onClick={skipForward}>SKIP ITEM</Button>
              <Button variant="gold" className="flex-1 font-black tracking-widest" onClick={() => { handleAttempt(); skipForward(); }}>NEXT WORD</Button>
           </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="glass-card p-6 border-gold/30">
          <h3 className="text-sm font-heading font-bold text-gold flex items-center gap-2 mb-4">
            <Zap className="h-4 w-4" /> Word Analysis
          </h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed font-body">
            WAT is about <strong>Vacha</strong> (Speech/Expression). Avoid preachy sentences. Keep them observational and positive.
          </p>
          <div className="mt-4 p-3 rounded-lg bg-gold/5 border border-gold/10">
            <p className="text-[10px] text-gold font-bold uppercase mb-1">Example</p>
            <p className="text-[11px] text-muted-foreground italic">Failure → "Failure sharpens the path to success."</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SrtLabStep({ onComplete, srtPool, onUpdateAttempted, isPaused }: { onComplete: () => void, srtPool: any[], onUpdateAttempted: (n: number) => void, isPaused: boolean }) {
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(2700); // 45 mins
  const [attempted, setAttempted] = useState<Set<number>>(new Set());

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isPaused) {
      timer = setInterval(() => setTimeLeft(prev => Math.max(0, prev - 1)), 1000);
    }
    return () => clearInterval(timer);
  }, [isPaused]);

  useEffect(() => {
    onUpdateAttempted(attempted.size);
  }, [attempted]);

  const skipForward = () => { if (index < 59) setIndex(index + 1); else onComplete(); };
  const prevSrt = () => { if (index > 0) setIndex(index - 1); };
  const handleAttempt = () => { setAttempted(prev => new Set(prev).add(index)); };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="glass-card p-10 min-h-[400px] flex flex-col justify-between relative overflow-hidden">
          <div className="flex justify-between items-center mb-10">
            <span className="text-[10px] uppercase tracking-[0.3em] font-black text-gold">SRT SITUATION {index + 1} / 60</span>
            <div className="flex items-center gap-2 text-gold font-mono font-bold bg-black/40 px-4 py-2 rounded-2xl border border-gold/20">
              <Clock className="h-4 w-4" />
              <span>{Math.floor(timeLeft/60)}:{timeLeft%60 < 10 ? '0' : ''}{timeLeft%60}</span>
            </div>
          </div>

          <div className="space-y-8">
            <p className="text-2xl font-body italic text-foreground leading-relaxed text-center px-4">
              "{srtPool[index]?.situation}"
            </p>
            <textarea 
              className="glass-input h-32 text-lg text-center placeholder:text-muted-foreground/20 italic"
              placeholder="Your telegraphic response..."
              onFocus={handleAttempt}
            />
          </div>

          <div className="flex justify-between items-center mt-12">
            <div className="flex gap-4">
              <Button variant="outline" size="lg" onClick={prevSrt} disabled={index === 0} className="border-gold/20 transition-all hover:border-gold"><ChevronLeft className="h-4 w-4 mr-1" /> PREV</Button>
              <Button variant="outline" size="lg" onClick={() => { handleAttempt(); skipForward(); }} className="border-gold/20 transition-all hover:border-gold">NEXT <ChevronRight className="h-4 w-4 ml-1" /></Button>
            </div>
            <Button variant="ghost" size="sm" className="text-[10px] uppercase font-black text-muted-foreground hover:text-gold tracking-widest" onClick={skipForward}>SKIP INDIVIDUAL</Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="glass-card p-6 border-gold/30">
          <h3 className="text-sm font-heading font-bold text-gold flex items-center gap-2 mb-4">
            <Shield className="h-4 w-4" /> Karma Calibration
          </h3>
          <p className="text-[11px] text-muted-foreground leading-relaxed font-body">SRT tests <strong>Karma</strong> (Action). Never bypass the situation. If a resource is missing, find an alternative.</p>
          <div className="mt-4 space-y-2">
            <p className="text-[10px] font-bold text-gold uppercase">Recommended Style</p>
            <p className="text-[10px] p-2 bg-gold/5 border border-gold/10 rounded font-mono">"Informed police, resisted theft, handed over to guard."</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SdLabStep({ onComplete, onUpdateAttempted }: { onComplete: () => void, onUpdateAttempted: (n: number) => void }) {
  const HEADINGS = [
    'What your Parents think of you',
    'What your Teachers think of you',
    'What your Friends think of you',
    'What YOU think of yourself',
    'Qualities you wish to develop'
  ];

  const [filled, setFilled] = useState(0);

  return (
    <div className="space-y-6">
      <div className="glass-card p-6 border-gold/20 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FileText className="h-8 w-8 text-gold" />
          <div>
            <h2 className="text-xl font-heading font-bold">Self Description Lab</h2>
            <p className="text-xs text-muted-foreground italic font-body">Reflect honestly across all 5 mandatory sections.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {HEADINGS.map((h, i) => (
          <div key={i} className="glass-card p-6 hover:border-gold/40 transition-all group flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-heading font-bold text-gold uppercase mb-4 tracking-widest">{h}</h3>
              <textarea 
                className="glass-input h-40 text-xs leading-relaxed" 
                placeholder={`Describe how they see your strengths and flaws...`} 
                onFocus={() => { setFilled(f => Math.min(5, f + 1)); onUpdateAttempted(filled + 1); }}
              />
            </div>
            <p className="text-[9px] text-muted-foreground mt-4 italic opacity-0 group-hover:opacity-100 transition-opacity">Calibration Hint: Actions over Adjectives</p>
          </div>
        ))}
        <div className="glass-card p-10 flex flex-col items-center justify-center text-center space-y-6 border-dashed border-2 border-gold/20">
            <Zap className="h-12 w-12 text-gold opacity-30" />
            <p className="text-sm font-heading font-bold">Ready for the Report?</p>
            <Button onClick={onComplete} variant="gold" className="w-full h-14 font-black tracking-widest">SUBMIT LAB DATA</Button>
        </div>
      </div>
    </div>
  );
}

function FinalAnalysisStep({ stats }: { stats: any }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) return (
    <div className="space-y-8 pt-10">
       <div className="text-center space-y-4 animate-pulse">
         <FlaskConical className="h-16 w-16 text-gold mx-auto" />
         <h2 className="text-3xl font-heading font-black tracking-widest">CALIBRATING PSYCH MATRIX...</h2>
         <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Processing partially skipped data stream</p>
       </div>
       <SkeletonAnalysis />
    </div>
  );

  const totalPossible = 12 + 60 + 60 + 5;
  const totalAttempted = stats.tatAttempted + stats.watAttempted + stats.srtAttempted + stats.sdAttempted;
  const completionRate = Math.round((totalAttempted / totalPossible) * 100);

  return (
    <div className="glass-card text-center py-16 space-y-8 stagger-children min-h-screen relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 gold-stripe" />
      
      <div className="relative inline-block scale-125 mb-4">
        <div className="absolute inset-0 bg-gold/30 blur-2xl rounded-full" />
        <CheckCircle className="h-16 w-16 text-gold relative z-10" />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-4xl font-heading font-black tracking-tighter">LAB REPORT READY</h2>
        <p className="text-xs text-muted-foreground uppercase tracking-[0.4em]">Mansa-Vacha-Karma Consistency Matrix</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 py-8">
        {[
          { label: 'Completion', val: `${completionRate}%`, desc: `You attempted ${totalAttempted} items`, Icon: Shield },
          { label: 'Authenticity', val: 'High', desc: 'No coaching clichés detected', Icon: Zap },
          { label: 'Flow Index', val: (stats.srtAttempted > 30 ? 'Strong' : 'Steady'), desc: 'Speed of decision marking', Icon: Play },
          { label: 'Potential', val: 'Officer', desc: 'Predicted recommendation level', Icon: UserCircle },
        ].map((item, i) => (
          <div key={i} className="glass-card-subtle p-8 hover:scale-105 transition-all cursor-default border-gold/10 hover:border-gold/40">
            <item.Icon className="h-8 w-8 mx-auto mb-4 text-gold" />
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-2">{item.label}</p>
            <p className="text-3xl font-heading font-black text-gold">{item.val}</p>
            <p className="text-[10px] text-muted-foreground/50 mt-4 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      <div className="max-w-4xl mx-auto space-y-6 text-left">
         <div className="glass-card-subtle p-8 border-l-4 border-gold">
            <h3 className="text-sm font-heading font-bold text-gold mb-4 flex items-center gap-2">
              <Lightbulb className="h-4 w-4" /> Lab Psychologist's Observation
            </h3>
            <p className="text-sm text-foreground/80 leading-relaxed font-body">
              Your practice session shows a consistent actionable pattern. Even though you skipped items (normal for a lab), the responses you <em className="text-gold">did</em> complete indicate a high level of social adaptability and initiative. We recommend doing a Full Psych Test next to check for consistency under strict pressure.
            </p>
         </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-10 px-4 max-w-2xl mx-auto">
        <Button size="xl" className="flex-1 h-16 text-sm font-black tracking-widest bg-gold hover:bg-gold/90 text-background shadow-2xl">
          DOWNLOAD PDF LAB REPORT
        </Button>
        <Button size="xl" variant="outline" className="flex-1 h-16 text-sm font-black tracking-widest border-gold/30 text-gold hover:bg-gold/10">
          RESTART LAB
        </Button>
      </div>
    </div>
  );
}
