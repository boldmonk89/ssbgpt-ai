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
    setExamStats({ [key]: value });
  };

  return (
    <div className="space-y-4 scroll-reveal pb-24 max-w-6xl mx-auto">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-4">
          {mode !== 'DASHBOARD' && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setMode('DASHBOARD')}
              className="h-10 w-10 rounded-full hover:bg-white/10"
            >
              <ChevronLeft className="h-6 w-6 text-white" />
            </Button>
          )}
          <div className="border-l-2 border-gold pl-4">
            <h1 className="text-2xl font-bold tracking-tight text-white uppercase font-sans">SSB PRACTICE LAB</h1>
            <p className="text-muted-foreground font-body text-[10px] uppercase tracking-[0.2em] opacity-60">Clinical Assessment Environment</p>
          </div>
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

function RulesOverlay({ title, rules, onStart }: { title: string, rules: string[], onStart: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] bg-black backdrop-blur-3xl flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8 text-center scroll-reveal">
        <h2 className="text-4xl font-bold tracking-[0.2em] text-white uppercase border-b border-white/10 pb-4">{title} RULES</h2>
        <ul className="space-y-4 text-left max-w-lg mx-auto">
          {rules.map((rule, i) => (
            <li key={i} className="flex items-start gap-3 text-white/80">
              <span className="text-gold font-bold">•</span>
              <p className="text-lg leading-relaxed font-sans">{rule}</p>
            </li>
          ))}
        </ul>
        <div className="pt-8">
           <Button onClick={onStart} size="xl" className="w-full h-16 bg-white text-black font-bold text-xl rounded-none hover:bg-gold transition-colors">
             START WRITING
           </Button>
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

  if (showRules) return <RulesOverlay title="TAT" onStart={() => { setShowRules(false); speak("Test beginning."); }} rules={[
    "The picture will appear on the screen for 30 sec (Do not write during this time)",
    "For the next 4 minutes the screen will go blank. Write your story during these 4 minutes.",
    "Keep writing material ready before you proceed."
  ]} />;

  if (isUploadPhase) return <PdfMilestone title="TAT Story Set" onComplete={onComplete} count={12} />;

  return (
    <div className="space-y-4">
       <div className="flex items-center justify-between glass-card p-3 border-none bg-white/5">
          <span className="text-xl font-bold text-white uppercase tracking-tight">SCENE {index + 1} / 12</span>
          <div className="flex items-center gap-2 opacity-0">
            <Clock className="h-4 w-4" />
            <span className="text-xl font-mono">{timeLeft}s</span>
          </div>
       </div>

       <div className="relative max-h-[65vh] w-full rounded-2xl overflow-hidden border border-white/5 bg-black flex items-center justify-center">
          {isViewing ? (
             index < 11 ? (
               <img src={tatPool[index]} className="max-h-[65vh] w-full object-contain animate-in fade-in duration-500" />
             ) : (
               <div className="absolute inset-0 bg-white" />
             )
          ) : (
            <div className="flex flex-col items-center text-center space-y-4 py-20">
               <Pencil className="h-10 w-10 text-gold/40" />
               <h2 className="text-3xl font-bold uppercase text-white tracking-widest">START WRITING</h2>
               <p className="text-[10px] text-muted-foreground uppercase tracking-widest leading-relaxed">Focus on Hero's thoughts and ultimate resolution.</p>
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

  if (showRules) return <RulesOverlay title="WAT" onStart={() => { setShowRules(false); speak("Test beginning."); }} rules={[
    "60 words will be displayed sequentially.",
    "Each word will stay on screen for 15 seconds.",
    "Write your first thought/sentence during this time.",
    "Do not pause or wait. Respond instinctively."
  ]} />;

  if (isUploadPhase) return <PdfMilestone title="WAT Sentence Set" onComplete={onComplete} count={60} />;

  return (
    <div className="space-y-4">
       <div className="flex items-center justify-between px-2">
         <span className="text-sm font-bold text-white uppercase tracking-widest opacity-60">WORD {index + 1} / 60</span>
         <div className="flex items-center gap-2 opacity-0">
            <Clock className="h-3 w-3" />
            <span className="text-sm font-mono">{timeLeft}s</span>
         </div>
       </div>

       <div className="glass-card h-[300px] flex items-center justify-center bg-black/60 rounded-[2rem] border border-white/5">
          <h2 className="text-6xl font-sans font-bold text-white text-center animate-in fade-in duration-300 uppercase tracking-tighter">
            {watPool[index]?.word.toLowerCase() || '---'}
          </h2>
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

  if (showRules) return <RulesOverlay title="SRT" onStart={() => { setShowRules(false); speak("Test beginning."); }} rules={[
    "60 situations will be displayed in pages.",
    "Total time: 45 Minutes for all 60 situations.",
    "Write brief, logical and action-oriented responses.",
    "Focus on what you will actually DO in that situation."
  ]} />;

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

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {currentSituations.map((srt, i) => (
            <div key={i} className="glass-card bg-white/5 border-white/5 p-6 h-36 flex flex-col justify-between">
               <div className="flex gap-4">
                  <span className="text-xs font-black text-gold/30">{currentPage * pageSize + i + 1}.</span>
                  <p className="text-[10px] leading-relaxed italic text-white/80 line-clamp-5">
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
  const [isUploadPhase, setIsUploadPhase] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (!isPaused && !isUploadPhase && !showRules) {
      timer = setInterval(() => setTimeLeft(prev => Math.max(0, prev - 1)), 1000);
    }
    return () => clearInterval(timer);
  }, [isPaused, isUploadPhase]);

  if (showRules) return <RulesOverlay title="SD" onStart={() => { setShowRules(false); speak("Test beginning."); }} rules={[
    "Write 5 paragraphs about what others think of you.",
    "Total time: 15 Minutes.",
    "Cover: Parents, Teachers, Friends, Self, and Goals.",
    "Be honest and balanced in your appraisal."
  ]} />;

  if (isUploadPhase) return <PdfMilestone title="SD Component" onComplete={onComplete} count={5} />;

  return (
    <div className="max-w-2xl mx-auto py-6 space-y-6">
       <div className="glass-card p-10 text-center bg-black border-gold/20 border-t-4 space-y-4">
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">SD APPRAISAL</h2>
          <div className="inline-flex items-center gap-3 opacity-0">
             <Clock className="h-5 w-5" />
             <span className="text-2xl font-mono">
                {Math.floor(timeLeft/60)}:{timeLeft%60 < 10 ? '0' : ''}{timeLeft%60}
             </span>
          </div>
          <Button size="xl" variant="gold" onClick={() => setIsUploadPhase(true)} className="w-full h-16 text-lg font-bold uppercase rounded-none">
             SUBMIT REFLECTION
          </Button>
       </div>
    </div>
  );
}

function PdfMilestone({ title, onComplete, count }: { title: string, onComplete: () => void, count: number }) {
  const [isUploaded, setIsUploaded] = useState(false);

  return (
    <div className="max-w-xl mx-auto py-10 animate-in zoom-in-95">
       <div className="glass-card p-12 text-center space-y-8 border-success/30 border-t-4 bg-success/5">
          <FileText className="h-12 w-12 text-success mx-auto" />
          <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Component Complete</h2>
          <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{title} — {count} Items Recorded</p>
          <div 
            onClick={() => setIsUploaded(!isUploaded)}
            className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 transition-all ${isUploaded ? 'border-success bg-white/5' : 'border-white/10 hover:border-success/40'}`}
          >
             {isUploaded ? <CheckCircle className="h-10 w-10 text-success mx-auto" /> : <Upload className="h-10 w-10 text-success/60 mx-auto" />}
          </div>
          <Button disabled={!isUploaded} onClick={onComplete} size="xl" className="w-full h-16 bg-success text-white">
            CONFIRM UPLOAD
          </Button>
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
      const res = await callGemini(prompt + "\n\nAnalyze the attempted counts and provide a strictly clinical and professional assessment. DO NOT use markdown bolding (**) in your response.");
      setAnalysisResult(res.replace(/\*\*/g, ''));
    } catch (e: any) {
      toast.error("Analysis generation failed");
    } finally {
      setLoading(false);
    }
  };

  if (!analysisResult && !loading) return (
     <div className="glass-card p-20 text-center space-y-8 border-gold/40 border-t-8 bg-black/60 backdrop-blur-3xl">
        <BrainCircuit className="h-16 w-16 text-gold mx-auto" />
        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase">Generate Lab Matrix</h2>
        <Button onClick={handleGenerate} size="xl" className="w-full max-w-sm h-16 bg-gold text-black uppercase">
           START AI ANALYSIS
        </Button>
     </div>
  );

  if (loading) return (
    <div className="space-y-10 pt-10 text-center max-w-5xl mx-auto">
       <FlaskConical className="h-16 w-16 text-gold mx-auto animate-pulse" />
       <h2 className="text-4xl font-black tracking-widest text-white italic uppercase">CALIBRATING NEURAL PROFILE...</h2>
       <SkeletonAnalysis />
    </div>
  );

  return (
    <div className="glass-card p-10 text-center space-y-8 bg-black/40">
      <CheckCircle className="h-12 w-12 text-gold mx-auto" />
      <h2 className="text-4xl font-black tracking-tighter text-white uppercase italic font-serif">EXAMINATION VERIFIED</h2>
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
