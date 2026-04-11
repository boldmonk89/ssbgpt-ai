import { useState, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Timer, FileText, Share2, Shield, Upload, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { WAT_WORDS, SRT_SITUATIONS } from '@/data/psychTestData';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

// We'll shuffle these pools to pick the test sets
const shuffle = (array: any[]) => [...array].sort(() => Math.random() - 0.5);

type TestStep = 'INSTRUCTIONS' | 'PIQ' | 'TAT' | 'WAT' | 'SRT' | 'SD' | 'FEEDBACK' | 'ANALYSIS';

export default function FullAnalysisPage() {
  const [step, setStep] = useState<TestStep>('INSTRUCTIONS');
  const [progress, setProgress] = useState(0);

  // States for shuffling
  const [tatPool, setTatPool] = useState<any[]>([]);
  const [watPool, setWatPool] = useState<any[]>([]);
  const [srtPool, setSrtPool] = useState<any[]>([]);

  useEffect(() => {
    // Shuffling on mount for this session
    setWatPool(shuffle(WAT_WORDS).slice(0, 60));
    setSrtPool(shuffle(SRT_SITUATIONS).slice(0, 60));
    // TAT images will be added here
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
    <div className="space-y-6 scroll-reveal pb-20">
      <div className="gold-border-left">
        <h1 className="text-3xl font-heading font-black tracking-tight">SSB Psychological Examination</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">Real SSB Pattern — Strict Timers — Mansa-Vacha-Karma Verification</p>
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
      {step === 'ANALYSIS' && <FinalAnalysisStep />}
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
              <strong>WARNING:</strong> This is a continuous examination. Ensure you have 2+ hours and a pen/paper ready. You must upload your PDFs at each milestone to receive the final Clinical Report.
            </p>
          </div>
        </div>

        <Button size="xl" onClick={onStart} className="w-full">Initialize Examination</Button>
      </div>
    </div>
  );
}

// STUB COMPONENTS - These will be implemented in the next steps
function PiqStep({ onComplete }: { onComplete: () => void }) {
  return (
    <div className="glass-card text-center py-20">
      <h2 className="text-xl font-heading font-bold mb-4">Step 1: Universal Context (PIQ)</h2>
      <p className="text-muted-foreground mb-8">Upload your PIQ form for baseline psychological analysis.</p>
      <Button onClick={onComplete}>Next: TAT</Button>
    </div>
  );
}

function TatStep({ onComplete }: { onComplete: () => void }) {
  const [index, setIndex] = useState(0);
  const [isViewing, setIsViewing] = useState(true);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isFinished, setIsFinished] = useState(false);

  // Real TAT Image pool: tat1.jpg to tat20.jpg (User to place in public/tat/)
  const tatImagePaths = Array.from({ length: 20 }, (_, i) => `/tat/tat${i + 1}.jpg`);
  const [activeTatSet, setActiveTatSet] = useState<string[]>([]);

  useEffect(() => {
    // Pick 11 random images + 1 blank slide
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
              return 240; // 4 minutes for writing
            } else {
              if (index < totalSlides - 1) {
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
        <span className="text-xs font-heading font-bold text-gold">SCENE {index + 1} / {totalSlides}</span>
        <div className="flex items-center gap-2 text-gold">
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
                // Fallback if user hasn't uploaded yet
                e.currentTarget.style.display = 'none';
                e.currentTarget.parentElement?.querySelector('.fallback')?.classList.remove('hidden');
              }}
            />
          ) : (
            <div className="absolute inset-0 bg-white" /> // Blank Slide
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
  const [showWord, setShowWord] = useState(true); // false for "Turn Page"
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isFinished) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (showWord && (index + 1) % 15 === 0 && index < 59) {
              setShowWord(false);
              return 15; // Turn page break
            } else {
              if (index < 59) {
                if (!showWord) setShowWord(true); // back to words after break
                setIndex((i) => i + 1);
                return 15;
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
      <div className="absolute top-4 right-4 flex items-center gap-2 text-gold font-mono font-bold">
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
  const [timeLeft, setTimeLeft] = useState(2700); // 45 minutes
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
        <div className="flex items-center gap-2 px-4 py-2 bg-black/40 rounded-xl border border-gold/20 text-gold font-mono font-bold">
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
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
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
        <div className="flex items-center gap-2 px-4 py-2 bg-black/40 rounded-xl border border-gold/20 text-gold font-mono font-bold">
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

function FinalAnalysisStep() {
  return (
    <div className="glass-card text-center py-12 space-y-6 stagger-children">
      <div className="relative inline-block">
        <div className="absolute inset-0 bg-gold/20 blur-xl rounded-full animate-pulse" />
        <CheckCircle className="h-20 w-20 text-gold relative z-10" />
      </div>
      <h2 className="text-3xl font-heading font-black tracking-tight">Examination Complete</h2>
      <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
        All Mansa-Vacha-Karma data points captured. Our psychologists are now synthesizing your Officer Like Qualities (OLQ) profile.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-8">
        <div className="glass-card-subtle">
          <div className="text-gold font-bold mb-1 uppercase text-[10px]">Cross-Match</div>
          <p className="text-xs text-muted-foreground">Checking for cognitive consistency across TAT, WAT and SRT.</p>
        </div>
        <div className="glass-card-subtle">
          <div className="text-gold font-bold mb-1 uppercase text-[10px]">Stress Markers</div>
          <p className="text-xs text-muted-foreground">Detecting signs of over-practice or hidden psychological pressure.</p>
        </div>
        <div className="glass-card-subtle flex flex-col items-center justify-center p-6 h-[400px]">
          <div className="text-gold font-bold mb-4 uppercase text-[10px]">Officer Like Quality Matrix</div>
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={mockOlqData}>
              <PolarGrid stroke="#ffffff20" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#888', fontSize: 8 }} />
              <Radar
                name="OLQ"
                dataKey="A"
                stroke="#EAB308"
                fill="#EAB308"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <Button size="xl" className="w-full">Review My Psych Profile</Button>
    </div>
  );
}
