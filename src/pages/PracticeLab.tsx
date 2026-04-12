import { useState, useEffect, useRef } from 'react';
import { useAppStore } from '@/store/appStore';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Timer, FileText, Share2, Shield, Upload, Clock, 
  AlertTriangle, CheckCircle, Zap, UserCircle, 
  FlaskConical, Play, Pause, ChevronLeft, ChevronRight,
  SkipForward, Lightbulb, Save, Layout, Pencil, Maximize2, Eye, FileDown, BrainCircuit
} from 'lucide-react';
import { WAT_WORDS, SRT_SITUATIONS } from '@/data/psychTestData';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { SkeletonAnalysis } from '@/components/SkeletonAnalysis';
import { ExportPdfButton } from '@/components/ExportPdfButton';
import { buildFullReportPrompt, callGemini } from '@/lib/gemini';

// Shuffling utility
const shuffle = (array: any[]) => [...array].sort(() => Math.random() - 0.5);

type LabMode = 'DASHBOARD' | 'TAT' | 'WAT' | 'SRT' | 'SD' | 'ANALYSIS';

const speak = (text: string) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1;
  speechSynthesis.speak(utterance);
};

export default function PracticeLabPage() {
  const { examStats, setExamStats } = useAppStore();
  const [mode, setMode] = useState<LabMode>('DASHBOARD');
  const [isPaused, setIsPaused] = useState(false);
  
  // Test Data States
  const [tatPool, setTatPool] = useState<string[]>([]);
  const [watPool, setWatPool] = useState<any[]>([]);
  const [srtPool, setSrtPool] = useState<any[]>([]);

  useEffect(() => {
    const tatImages = Array.from({ length: 20 }, (_, i) => `/tat/tat${i + 1}.png`);
    setTatPool(shuffle(tatImages).slice(0, 11)); // 11 + 1 blank
    setWatPool(shuffle(WAT_WORDS).slice(0, 60));
    setSrtPool(shuffle(SRT_SITUATIONS).slice(0, 60));
  }, []);

  const updateStats = (key: string, value: number) => {
    toast.info("Clinical baseline anchored — Response pattern recording active.", { 
      icon: "🛡️",
      className: "font-sans uppercase text-[10px] tracking-widest font-bold"
    });
    setExamStats({ [key]: value });
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  return (
    <div className="space-y-4 scroll-reveal pb-24 max-w-6xl mx-auto">
      <div className="flex items-center justify-between px-2 mb-6 pt-4">
        <div className="flex items-center gap-4">
          <div className="border-l-2 border-gold pl-4">
            <h1 className="text-xl font-bold tracking-tight text-white uppercase font-sans">SSB PRACTICE LAB</h1>
            <p className="text-muted-foreground font-body text-[10px] uppercase tracking-[0.2em] opacity-60 italic-none">Clinical Assessment Environment</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            onClick={toggleFullscreen}
            className="glass-button-gold w-10 h-10 p-0 flex items-center justify-center"
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => {
              if (mode === 'DASHBOARD') window.location.href = '/dashboard';
              else setMode('DASHBOARD');
            }}
            className="glass-button-gold px-6 h-10 text-[10px] font-black tracking-widest uppercase flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" /> {mode === 'DASHBOARD' ? 'BACK TO HOME' : 'EXIT TO DASHBOARD'}
          </Button>
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        {mode === 'DASHBOARD' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <DashboardCard 
              title="TAT Lab" 
              icon={Eye} 
              desc="Thematic Apperception Test. 12 Slides." 
              onClick={() => setMode('TAT')} 
            />
            <DashboardCard 
              title="WAT Lab" 
              icon={Zap} 
              desc="Word Association Test. 60 words." 
              onClick={() => setMode('WAT')} 
            />
            <DashboardCard 
              title="SRT Lab" 
              icon={Shield} 
              desc="Situation Reaction Test. 60 situations." 
              onClick={() => setMode('SRT')} 
            />
            <DashboardCard 
              title="SD Lab" 
              icon={FileText} 
              desc="Self Description Appraisal." 
              onClick={() => setMode('SD')} 
            />
            <DashboardCard 
              title="Synthesis Engine" 
              icon={BrainCircuit} 
              desc="Psychological Narrative Synthesis." 
              onClick={() => setMode('ANALYSIS')} 
              accent
            />
          </div>
        )}

        {mode === 'TAT' && <TatLabStep onComplete={() => setMode('DASHBOARD')} tatPool={tatPool} onUpdateAttempted={(n) => updateStats('tatAttempted', n)} isPaused={isPaused} />}
        {mode === 'WAT' && <WatLabStep onComplete={() => setMode('DASHBOARD')} watPool={watPool} onUpdateAttempted={(n) => updateStats('watAttempted', n)} isPaused={isPaused} />}
        {mode === 'SRT' && <SrtLabStep onComplete={() => setMode('DASHBOARD')} srtPool={srtPool} onUpdateAttempted={(n) => updateStats('srtAttempted', n)} isPaused={isPaused} />}
        {mode === 'SD' && <SdLabStep onComplete={() => setMode('DASHBOARD')} onUpdateAttempted={(n) => updateStats('sdAttempted', n)} isPaused={isPaused} />}
        {mode === 'ANALYSIS' && <FinalAnalysisStep stats={examStats} onBack={() => setMode('DASHBOARD')} />}
      </div>

      {mode !== 'DASHBOARD' && mode !== 'ANALYSIS' && (
        <div className="fixed bottom-6 right-6 flex items-center gap-3 z-[100]">
           <Button variant="outline" size="icon" onClick={() => setIsPaused(!isPaused)} className={`h-12 w-12 rounded-xl border-white/10 bg-black/40 backdrop-blur-md transition-all ${isPaused ? 'bg-gold/20 border-gold' : ''}`}>
            {isPaused ? <Play className="h-5 w-5 text-gold" /> : <Pause className="h-5 w-5 text-white" />}
          </Button>
          <Button onClick={() => setMode('DASHBOARD')} variant="secondary" className="rounded-xl px-6 h-12 font-bold shadow-2xl">
            EXIT TO DASHBOARD
          </Button>
        </div>
      )}
    </div>
  );
}

function DashboardCard({ title, icon: Icon, desc, onClick, accent = false }: { title: string, icon: any, desc: string, onClick: () => void, accent?: boolean }) {
  return (
    <div 
      onClick={onClick}
      className={`glass-card p-4 cursor-pointer transition-all border-white/5 active:scale-95 flex flex-col items-center text-center space-y-2 ${accent ? 'bg-gold/5 border-gold/20' : 'hover:bg-white/5'}`}
    >
      <div className={`p-2 rounded-xl ${accent ? 'bg-gold/10 text-gold' : 'bg-white/5 text-white/40'}`}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className={`text-base font-bold uppercase tracking-tight ${accent ? 'text-gold' : 'text-white'}`}>{title}</h3>
      <p className="text-[9px] text-muted-foreground leading-tight uppercase tracking-widest opacity-60">{desc}</p>
    </div>
  );
}

function RulesScreen({ title, rules, onStart, onBack }: { title: string, rules: string[], onStart: () => void, onBack: () => void }) {
  const [checked, setChecked] = useState({ paper: false, quiet: false, time: false });
  const allChecked = checked.paper && checked.quiet && checked.time;

  return (
    <div className="max-w-xl mx-auto space-y-12 py-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-3">
        <h2 className="text-4xl font-black text-white tracking-[0.2em] uppercase font-sans leading-tight">{title}</h2>
        <div className="h-1 w-20 bg-gold mx-auto" />
        <p className="text-[10px] text-gold uppercase tracking-[0.4em] font-bold opacity-80 mt-2">Standardized Rules of Engagement</p>
      </div>

      <div className="glass-card p-1">
        <div className="bg-black/40 p-8 space-y-8">
          <ul className="space-y-6">
            {rules.map((rule, i) => (
              <li key={i} className="flex items-start gap-4">
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-bold font-mono text-gold">{i + 1}</span>
                <p className="text-sm leading-relaxed font-sans text-white/80">{rule}</p>
              </li>
            ))}
          </ul>

          <div className="space-y-4 pt-8 border-t border-white/5">
            <h3 className="text-[10px] text-white/40 uppercase tracking-[0.3em] font-bold text-center">Environment Verification</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { id: 'paper', label: 'Pen & Paper' },
                { id: 'quiet', label: 'Isolated Space' },
                { id: 'time', label: 'Full Slot Ready' }
              ].map((item) => (
                <label key={item.id} className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-gold/10 hover:border-gold/40 transition-all group">
                  <input 
                    type="checkbox" 
                    checked={checked[item.id as keyof typeof checked]}
                    onChange={() => setChecked(prev => ({ ...prev, [item.id]: !prev[item.id as keyof typeof checked] }))}
                    className="h-4 w-4 appearance-none rounded border-gold border-2 bg-transparent checked:bg-gold transition-all cursor-pointer"
                  />
                  <span className="text-[9px] text-white/40 uppercase font-black group-hover:text-gold">{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-4">
            <Button 
              disabled={!allChecked}
              onClick={() => {
                toast.info("Clinical session initiated.", { icon: "🖋️" });
                onStart();
              }} 
              size="xl" 
              className="w-full h-16 bg-gold text-black font-black text-lg tracking-widest rounded-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20 shadow-[0_20px_50px_rgba(207,169,78,0.2)]"
            >
              INITIATE SESSION
            </Button>
            <Button variant="ghost" onClick={onBack} className="text-white/40 uppercase tracking-widest text-[10px] h-10">
              Return to Laboratory Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TatLabStep({ onComplete, tatPool, onUpdateAttempted, isPaused }: { onComplete: () => void, tatPool: string[], onUpdateAttempted: (n: number) => void, isPaused: boolean }) {
  const [showRules, setShowRules] = useState(true);
  const [index, setIndex] = useState(0);
  const [isViewing, setIsViewing] = useState(true);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isUploadPhase, setIsUploadPhase] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isPaused && !isUploadPhase && !showRules) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (isViewing) {
              setIsViewing(false);
              speak("Begin writing."); // Only speak requested cues
              return 240;
            } else {
              if (index < 11) {
                setIndex(index + 1);
                setIsViewing(true);
                speak("Stop writing."); // Only speak requested cues
                return 30;
              } else {
                speak("Stop writing.");
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
  }, [isViewing, index, isPaused, isUploadPhase]);

  if (showRules) return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <RulesScreen 
        title="TAT Lab" 
        onBack={onComplete}
        onStart={() => { setShowRules(false); speak("Test beginning."); }}
        rules={[
          "The picture will appear on the screen for 30 sec.",
          "Observe details and formulate Hero's objective.",
          "Write your story during the blank slide interval.",
          "Keep writing material ready before you proceed."
        ]} 
      />
    </div>
  );

  if (isUploadPhase) return <PdfMilestone title="TAT Story Set" onComplete={onComplete} count={12} />;

  return (
    <div className="fixed inset-0 z-[500] bg-black flex flex-col items-center justify-center animate-in fade-in duration-1000">
       <Button 
         variant="ghost" 
         onClick={onComplete}
         className="absolute top-6 left-6 text-white/20 hover:text-white uppercase tracking-widest text-[8px]"
       >
         Abort Session
       </Button>

       <div className="absolute top-6 right-8 flex items-center gap-4">
          <div className="flex flex-col items-end">
             <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Scene {index + 1} / 12</span>
          </div>
       </div>

       <div className="w-full h-full flex items-center justify-center p-4">
          {isViewing ? (
             index < 11 ? (
               <img src={tatPool[index]} className="max-h-screen max-w-full object-contain shadow-2xl animate-in zoom-in-95 duration-[2000ms]" />
             ) : (
               <div className="w-full h-full bg-white transition-colors duration-1000" />
             )
          ) : (
            <div className="flex flex-col items-center text-center space-y-6">
               <div className="h-20 w-20 rounded-full border-2 border-white/5 flex items-center justify-center animate-pulse">
                 <Pencil className="h-8 w-8 text-white/20" />
               </div>
               <h2 className="text-4xl font-heading font-black text-white tracking-[0.4em]">Begin Writing</h2>
               <p className="text-xs text-white/30 uppercase tracking-[0.5em] font-sans">Focus — Action — Resolution</p>
            </div>
          )}
       </div>
    </div>
  );
}

function WatLabStep({ onComplete, watPool, onUpdateAttempted, isPaused }: { onComplete: () => void, watPool: any[], onUpdateAttempted: (n: number) => void, isPaused: boolean }) {
  const [showRules, setShowRules] = useState(true);
  const [index, setIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isUploadPhase, setIsUploadPhase] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isPaused && !isUploadPhase && !showRules) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (index < 59) {
              setIndex(index + 1);
              return 15;
            } else {
              setIsUploadPhase(true);
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [index, isPaused, isUploadPhase]);

  if (showRules) return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <RulesScreen 
        title="WAT Lab" 
        onBack={onComplete}
        onStart={() => { setShowRules(false); speak("Test beginning."); }}
        rules={[
          "60 words will be displayed sequentially.",
          "Each word will stay on screen for 15 seconds.",
          "Write your first thought/sentence during this time.",
          "Do not pause or wait. Respond instinctively."
        ]} 
      />
    </div>
  );

  if (isUploadPhase) return <PdfMilestone title="WAT Sentence Set" onComplete={onComplete} count={60} />;

  return (
    <div className="fixed inset-0 z-[500] bg-black flex flex-col items-center justify-center animate-in fade-in duration-1000">
       <Button 
         variant="ghost" 
         onClick={onComplete}
         className="absolute top-6 left-6 text-white/20 hover:text-white uppercase tracking-widest text-[8px]"
       >
         Abort Session
       </Button>

       <div className="absolute top-6 right-8 flex items-center gap-4">
          <div className="flex flex-col items-end">
             <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Word {index + 1} / 60</span>
          </div>
       </div>

       <div className="text-center space-y-2">
          <h2 className="text-4xl md:text-6xl font-heading font-black text-white tracking-tight animate-in zoom-in-90 fade-in duration-300">
            {watPool[index]?.word.toLowerCase() || '---'}
          </h2>
          <div className="h-1 w-24 bg-gold mx-auto mt-8 blur-[1px] opacity-50" />
       </div>
    </div>
  );
}

function SrtLabStep({ onComplete, srtPool, onUpdateAttempted, isPaused }: { onComplete: () => void, srtPool: any[], onUpdateAttempted: (n: number) => void, isPaused: boolean }) {
  const [showRules, setShowRules] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [timeLeft, setTimeLeft] = useState(2700);
  const [isUploadPhase, setIsUploadPhase] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isPaused && !isUploadPhase && !showRules) {
      timer = setInterval(() => setTimeLeft(prev => Math.max(0, prev - 1)), 1000);
    }
    return () => clearInterval(timer);
  }, [isPaused, isUploadPhase]);

  const pageSize = 15;
  const currentSituations = srtPool.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

  if (showRules) return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <RulesScreen 
        title="SRT Lab" 
        onBack={onComplete}
        onStart={() => { setShowRules(false); speak("Test beginning."); }}
        rules={[
          "60 situations will be presented in a clinical run.",
          "Observe each situation and record your logic.",
          "Be concise and write your spontaneous reaction.",
          "Focus on action-oriented responses."
        ]} 
      />
    </div>
  );

  if (isUploadPhase) return <PdfMilestone title="SRT Response Sheet" onComplete={onComplete} count={60} />;

  return (
    <div className="space-y-4">
       <div className="flex items-center justify-between glass-card bg-black/40 border-none p-4">
          <h2 className="text-xl font-bold uppercase text-white font-sans tracking-tight">SRT SITUATIONS</h2>
          <div className="flex items-center gap-2 opacity-0">
             <Clock className="h-4 w-4" />
             <span className="text-xl font-mono">
                {Math.floor(timeLeft/60)}:{timeLeft%60 < 10 ? '0' : ''}{timeLeft%60}
             </span>
          </div>
       </div>

       <div className="grid grid-cols-1 gap-4">
          {currentSituations.map((srt, i) => (
            <div key={i} className="glass-card bg-white/5 border-white/10 p-5 h-24 flex items-center">
               <div className="flex gap-6 items-center w-full">
                  <span className="text-[10px] font-bold text-gold/40 shrink-0">SIT {currentPage * pageSize + i + 1}</span>
                  <div className="h-8 w-px bg-white/10 shrink-0" />
                  <p className="text-sm font-medium leading-relaxed text-white/90 line-clamp-2">
                    {srt.situation}
                  </p>
               </div>
            </div>
          ))}
       </div>

       <div className="flex items-center justify-between pt-6">
          <Button variant="outline" size="xl" disabled={currentPage === 0} onClick={() => setCurrentPage(p => p - 1)} className="h-16 px-10 border-white/10">
            PREV PAGE
          </Button>
          {currentPage < 3 ? (
            <Button variant="outline" size="xl" onClick={() => setCurrentPage(p => p + 1)} className="h-16 px-10 border-white/10">
              NEXT PAGE
            </Button>
          ) : (
            <Button variant="gold" size="xl" onClick={() => setIsUploadPhase(true)} className="h-16 px-12 font-black tracking-widest">
              FINISH & UPLOAD
            </Button>
          )}
       </div>
    </div>
  );
}

function SdLabStep({ onComplete, onUpdateAttempted, isPaused }: { onComplete: () => void, onUpdateAttempted: (n: number) => void, isPaused: boolean }) {
  const [showRules, setShowRules] = useState(true);
  const [timeLeft, setTimeLeft] = useState(900);
  const [isFinished, setIsFinished] = useState(false);
  const [responses, setResponses] = useState({
    parents: '',
    teachers: '',
    friends: '',
    self: '',
    goals: ''
  });

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isPaused && !showRules && !isFinished) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === 180) toast.info("3 Minutes Remaining", { icon: "⏳" });
          if (prev <= 0) {
            setIsFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPaused, showRules, isFinished]);

  if (showRules) return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <RulesScreen 
        title="SD Lab" 
        onBack={onComplete}
        onStart={() => { setShowRules(false); speak("Test beginning."); }}
        rules={[
          "Write 5 distinct paragraphs about how others perceive you.",
          "Total time: 15 Minutes (Proctored).",
          "Sections: Parents, Teachers, Friends, Self, and Future Goals.",
          "Be honest and balanced. Avoid coached templates."
        ]} 
      />
    </div>
  );

  if (isFinished) return <PdfMilestone title="SD Component" onComplete={onComplete} count={5} />;

  const SECTIONS = [
    { id: 'parents', label: '1. What your Parents think of you', placeholder: 'Write about their trust, expectations, and your role at home...' },
    { id: 'teachers', label: '2. What your Teachers think of you', placeholder: 'Focus on academic discipline, participation, and reliability...' },
    { id: 'friends', label: '3. What your Friends think of you', placeholder: 'Mention loyalty, dependability, and how you behave in a group...' },
    { id: 'self', label: '4. What YOU think of yourself', placeholder: 'Your honest self-assessment, strengths and areas of conviction...' },
    { id: 'goals', label: '5. Qualities you wish to develop', placeholder: 'Specific traits you are currently working to improve...' },
  ];

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-12 animate-in fade-in duration-1000">
       <div className="text-center space-y-2">
          <h1 className="text-3xl md:text-5xl">Self Description Appraisal</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-[0.4em] font-bold">Clinical Mansa-Vacha Matching</p>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SECTIONS.map((section) => (
            <div key={section.id} className="glass-card-subtle p-6 border-white/5 flex flex-col gap-3">
               <h3 className="text-xs font-bold text-gold uppercase tracking-widest">{section.label}</h3>
               <p className="text-[11px] text-white/40 leading-relaxed italic">
                 Observe and prepare this section on your sheet. Focus on authenticity and balanced self-reflection.
               </p>
            </div>
          ))}
          <div className="glass-card bg-gold/5 border-gold/20 flex flex-col items-center justify-center p-8 text-center gap-4">
             <Pencil className="h-8 w-8 text-gold/40" />
             <h3 className="text-sm font-bold text-white uppercase">Proctored Session Active</h3>
             <p className="text-[10px] text-muted-foreground tracking-widest">Writing period: 15 Minutes</p>
          </div>
       </div>

       <div className="max-w-xl mx-auto">
          <Button 
            size="xl" 
            variant="gold" 
            onClick={() => setIsFinished(true)} 
            className="w-full h-20 text-xl font-bold rounded-none shadow-2xl"
          >
             FINISH & UPLOAD PDF
          </Button>
          <div className="mt-8 flex items-center justify-center gap-6 opacity-40">
             <div className="h-px w-10 bg-white/20" />
             <span className="text-[10px] uppercase tracking-widest font-mono">{Math.floor(timeLeft/60)}:{timeLeft%60 < 10 ? '0' : ''}{timeLeft%60} REMAINING</span>
             <div className="h-px w-10 bg-white/20" />
          </div>
       </div>
    </div>
  );
}

function PdfMilestone({ title, onComplete, count }: { title: string, onComplete: () => void, count: number }) {
  const [isUploaded, setIsUploaded] = useState(false);

  return (
    <div className="max-w-2xl mx-auto py-10 animate-in slide-in-from-bottom-4 duration-500">
       <div className="glass-card p-10 bg-black/40 border-gold/10 border-t-4 border-t-gold space-y-8">
          <div className="text-center space-y-2">
             <h2 className="text-3xl font-bold text-white uppercase tracking-tight font-sans">Verification Required</h2>
             <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground font-bold">{title} • Record Count: {count}</p>
          </div>

          <div 
            onClick={() => setIsUploaded(!isUploaded)}
            className={`cursor-pointer rounded-none border border-white/10 p-12 transition-all flex flex-col items-center gap-4 ${isUploaded ? 'bg-gold/5 border-gold/40' : 'bg-white/5 hover:bg-white/[0.08]'}`}
          >
             {isUploaded ? (
               <div className="space-y-4 text-center">
                 <CheckCircle className="h-8 w-8 text-gold mx-auto" />
                 <p className="text-xs font-bold text-gold uppercase tracking-widest">Document Secured & Verified</p>
               </div>
             ) : (
               <div className="space-y-4 text-center">
                 <Upload className="h-8 w-8 text-white/40 mx-auto" />
                 <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Click to Initiate Submission</p>
                 <p className="text-[9px] text-muted-foreground/60 uppercase">PDF • JPG • PNG (Max 10MB)</p>
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
                 toast.success("Document record verified. Profiler synchronizing.", { 
                   icon: "🛡️",
                   className: "font-sans uppercase text-[10px] tracking-widest font-bold"
                 });
                 onComplete();
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

function FinalAnalysisStep({ stats, onBack }: { stats: any, onBack: () => void }) {
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
        { note: "Lab mode session completed." },
        `User attempted ${stats.tatAttempted} TAT items.`,
        `User attempted ${stats.watAttempted} WAT items.`,
        `User attempted ${stats.srtAttempted} SRT items.`,
        `SD completed across ${stats.sdAttempted} dimensions.`
      );
      const res = await callGemini(prompt + "\n\nAnalyze the attempted counts and provide a strictly clinical and professional assessment. DO NOT use markdown bolding (**) or italics (*) in your response. No asterisks should be used.");
      setAnalysisResult(res.replace(/\*/g, ''));
    } catch (e: any) {
      toast.error("Analysis generation failed");
    } finally {
      setLoading(false);
    }
  };

  if (!analysisResult && !loading) return (
     <div className="glass-card p-20 text-center space-y-8 border-gold/40 border-t-8 bg-black/60 backdrop-blur-3xl">
        <BrainCircuit className="h-16 w-16 text-gold mx-auto" />
        <h2 className="text-2xl font-black text-white tracking-tighter uppercase">Generate Lab Matrix</h2>
        <Button onClick={handleGenerate} size="xl" className="w-full max-w-sm h-16 bg-gold text-black uppercase">
           START AI ANALYSIS
        </Button>
     </div>
  );

  if (loading) return (
    <div className="space-y-10 pt-10 text-center max-w-5xl mx-auto">
       <FlaskConical className="h-16 w-16 text-gold mx-auto animate-pulse" />
       <h2 className="text-2xl font-black tracking-widest text-white uppercase">CALIBRATING NEURAL PROFILE...</h2>
       <SkeletonAnalysis />
    </div>
  );

  return (
    <div className="glass-card p-10 text-center space-y-8 bg-black/40">
      <CheckCircle className="h-12 w-12 text-gold mx-auto" />
      <h2 className="text-2xl font-black tracking-tighter text-white uppercase font-sans">EXAMINATION VERIFIED</h2>
      <div className="max-w-4xl mx-auto prose prose-invert text-left bg-white/5 p-8 rounded-2xl border-l-4 border-gold shadow-2xl">
         <div className="text-white/80 font-body whitespace-pre-wrap leading-relaxed text-sm">
            {analysisResult}
         </div>
      </div>
      <div className="flex gap-4 max-w-lg mx-auto pt-4">
        <ExportPdfButton content={analysisResult} className="flex-1 h-16 bg-gold text-black rounded-2xl uppercase" />
        <Button size="xl" variant="outline" onClick={onBack} className="flex-1 h-16 uppercase rounded-2xl">BACK TO LAB</Button>
      </div>
    </div>
  );
}
