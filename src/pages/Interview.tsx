import React, { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/store';
import { callGemini, buildInterviewModeAPrompt, buildInterviewModeBPrompt, buildInterviewModeCPrompt } from '@/lib/gemini';
import { MessageSquare, RefreshCw, ChevronRight, Loader2, Target, Users, Mic, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AnalysisOutput } from '@/components/AnalysisOutput';
import PageTransition from '@/components/PageTransition';

export default function Interview() {
  const [activeTab, setActiveTab] = useState<'A' | 'B' | 'C'>('A');

  // Mode A state
  const [questionA, setQuestionA] = useState('');
  const [answerA, setAnswerA] = useState('');
  const [resultA, setResultA] = useState('');
  const [loadingA, setLoadingA] = useState(false);

  // Mode B state
  const [statementB, setStatementB] = useState('');
  const [resultB, setResultB] = useState('');
  const [loadingB, setLoadingB] = useState(false);

  // Mode C state
  const [transcriptC, setTranscriptC] = useState('');
  const [resultC, setResultC] = useState('');
  const [loadingC, setLoadingC] = useState(false);

  // Speech Recognition
  const [activeMic, setActiveMic] = useState<'answerA' | 'statementB' | 'transcriptC' | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-IN';
      }
    }
  }, []);

  const toggleMic = (field: 'answerA' | 'statementB' | 'transcriptC', setter: (v: any) => void) => {
    if (!recognitionRef.current) {
      alert("Voice recording is not supported in this browser. Please use Chrome.");
      return;
    }
    
    if (activeMic === field) {
      recognitionRef.current.stop();
      setActiveMic(null);
    } else {
      if (activeMic) recognitionRef.current.stop();
      setActiveMic(field);
      recognitionRef.current.onresult = (event: any) => {
        const text = event.results[event.results.length - 1][0].transcript;
        setter((prev: string) => prev + " " + text);
      };
      recognitionRef.current.onerror = () => setActiveMic(null);
      recognitionRef.current.onend = () => setActiveMic(null);
      try { recognitionRef.current.start(); } catch(e) { }
    }
  };

  const handleModeA = async () => {
    if (!questionA.trim() || !answerA.trim()) return;
    setLoadingA(true);
    try {
      const response = await callGemini(buildInterviewModeAPrompt(questionA, answerA));
      setResultA(response);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoadingA(false);
    }
  };

  const handleModeB = async () => {
    if (!statementB.trim()) return;
    setLoadingB(true);
    try {
      const response = await callGemini(buildInterviewModeBPrompt(statementB));
      setResultB(response);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoadingB(false);
    }
  };

  const handleModeC = async () => {
    if (!transcriptC.trim()) return;
    setLoadingC(true);
    try {
      const response = await callGemini(buildInterviewModeCPrompt(transcriptC));
      setResultC(response);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoadingC(false);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6 max-w-5xl mx-auto pb-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">Interview Practice</h1>
            <p className="text-muted-foreground font-body max-w-2xl">
              Sharpen your Personal Interview (PI) skills using the IO (Interviewing Officer) specialized AI. 
              Improve your answers, anticipate cross-questions, or run a full mock evaluation.
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => setActiveTab('A')}
            className={`glass-card p-4 transition-all duration-300 flex flex-col gap-2 relative overflow-hidden group border-2 ${activeTab === 'A' ? 'border-gold shadow-[0_0_20px_rgba(234,179,8,0.15)] bg-gold/5' : 'border-transparent hover:border-gold/30'}`}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className={`h-5 w-5 ${activeTab === 'A' ? 'text-gold' : 'text-muted-foreground group-hover:text-gold/70'}`} />
              <h3 className={`font-heading font-bold ${activeTab === 'A' ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>Answer Polish</h3>
            </div>
            <p className="text-xs text-muted-foreground text-left leading-relaxed">Fix weaknesses in a specific answer and get a structured, high-impact model response.</p>
          </button>

          <button
            onClick={() => setActiveTab('B')}
            className={`glass-card p-4 transition-all duration-300 flex flex-col gap-2 relative overflow-hidden group border-2 ${activeTab === 'B' ? 'border-gold shadow-[0_0_20px_rgba(234,179,8,0.15)] bg-gold/5' : 'border-transparent hover:border-gold/30'}`}
          >
            <div className="flex items-center gap-2">
              <RefreshCw className={`h-5 w-5 ${activeTab === 'B' ? 'text-gold' : 'text-muted-foreground group-hover:text-gold/70'}`} />
              <h3 className={`font-heading font-bold ${activeTab === 'B' ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>Counter Questions</h3>
            </div>
            <p className="text-xs text-muted-foreground text-left leading-relaxed">Enter a statement. See what 8-9 counter questions the IO will trap you with.</p>
          </button>

          <button
            onClick={() => setActiveTab('C')}
            className={`glass-card p-4 transition-all duration-300 flex flex-col gap-2 relative overflow-hidden group border-2 ${activeTab === 'C' ? 'border-gold shadow-[0_0_20px_rgba(234,179,8,0.15)] bg-gold/5' : 'border-transparent hover:border-gold/30'}`}
          >
            <div className="flex items-center gap-2">
              <Users className={`h-5 w-5 ${activeTab === 'C' ? 'text-gold' : 'text-muted-foreground group-hover:text-gold/70'}`} />
              <h3 className={`font-heading font-bold ${activeTab === 'C' ? 'text-foreground' : 'text-muted-foreground group-hover:text-foreground'}`}>Mock Transcript</h3>
            </div>
            <p className="text-xs text-muted-foreground text-left leading-relaxed">Paste an entire back-and-forth conversation for a full psychological consistency check.</p>
          </button>
        </div>

        {/* Tab Content */}
        <div className="glass-card shadow-lg border-t-2 border-t-gold/30">
          
          {/* Mode A */}
          {activeTab === 'A' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
              <h2 className="text-xl font-heading font-bold text-gold gold-border-left">Polish an Answer</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-heading font-semibold text-muted-foreground mb-1 block">What was the IO's question?</label>
                  <Input 
                    value={questionA} 
                    onChange={e => setQuestionA(e.target.value)} 
                    placeholder="e.g. Why do you want to join the Armed Forces?"
                    className="glass-input h-12"
                  />
                </div>
                <div className="relative">
                  <label className="text-sm font-heading font-semibold text-muted-foreground mb-1 block">Your Answer</label>
                  <Textarea 
                    value={answerA} 
                    onChange={e => setAnswerA(e.target.value)} 
                    placeholder="Type or record your exact response here..."
                    className={`glass-input min-h-[120px] pb-10 ${activeMic === 'answerA' ? 'border-primary shadow-[0_0_15px_rgba(234,179,8,0.3)]' : ''}`}
                  />
                  <button 
                    onClick={() => toggleMic('answerA', setAnswerA)} 
                    className={`absolute bottom-3 right-3 p-2 rounded-full transition-all ${activeMic === 'answerA' ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-transparent text-muted-foreground hover:bg-gold/10 hover:text-gold'}`}
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                </div>
                <button
                  onClick={handleModeA}
                  disabled={loadingA || !questionA.trim() || !answerA.trim()}
                  className="glass-button-gold w-full flex items-center justify-center gap-2 py-3"
                >
                  {loadingA ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                  {loadingA ? 'Analyzing Response...' : 'Improve Answer'}
                </button>
              </div>

              {resultA ? (
                <div className="space-y-4">
                  <AnalysisOutput content={resultA} title="Feedback & Improved Answer" />
                  <button onClick={() => { setResultA(''); setQuestionA(''); setAnswerA(''); }} className="glass-button text-xs px-4 py-2 hover:border-destructive hover:text-destructive flex items-center justify-center gap-2 w-full mx-auto max-w-sm mt-4">
                    <Trash2 className="h-4 w-4" /> Delete & Reset This Question
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* Mode B */}
          {activeTab === 'B' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
              <h2 className="text-xl font-heading font-bold text-gold gold-border-left">Generate Counter Questions</h2>
              
              <div className="space-y-4">
                <div className="relative">
                  <label className="text-sm font-heading font-semibold text-muted-foreground mb-1 block">Statement or Claim you plan to make</label>
                  <Textarea 
                    value={statementB} 
                    onChange={e => setStatementB(e.target.value)} 
                    placeholder="e.g. I am a highly motivated person and a natural leader because I was the captain of my college sports team."
                    className={`glass-input min-h-[120px] pb-10 ${activeMic === 'statementB' ? 'border-primary shadow-[0_0_15px_rgba(234,179,8,0.3)]' : ''}`}
                  />
                  <button 
                    onClick={() => toggleMic('statementB', setStatementB)} 
                    className={`absolute bottom-3 right-3 p-2 rounded-full transition-all ${activeMic === 'statementB' ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-transparent text-muted-foreground hover:bg-gold/10 hover:text-gold'}`}
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Target className="h-3 w-3" /> The IO will use this statement against you. Let's see how.
                  </p>
                </div>
                
                <button
                  onClick={handleModeB}
                  disabled={loadingB || !statementB.trim()}
                  className="glass-button-gold w-full flex items-center justify-center gap-2 py-3"
                >
                  {loadingB ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                  {loadingB ? 'Thinking like the IO...' : 'Generate Cross-Questions'}
                </button>
              </div>

              {resultB ? (
                <div className="space-y-4">
                  <AnalysisOutput content={resultB} title="IO Cross-Examination Plan" />
                  <button onClick={() => { setResultB(''); setStatementB(''); }} className="glass-button text-xs px-4 py-2 hover:border-destructive hover:text-destructive flex items-center justify-center gap-2 w-full mx-auto max-w-sm mt-4">
                    <Trash2 className="h-4 w-4" /> Delete & Reset This Statement
                  </button>
                </div>
              ) : null}
            </div>
          )}

          {/* Mode C */}
          {activeTab === 'C' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
              <h2 className="text-xl font-heading font-bold text-gold gold-border-left">Mock Interview Transcript Evaluation</h2>
              
              <div className="space-y-4">
                <div className="relative">
                  <label className="text-sm font-heading font-semibold text-muted-foreground mb-1 block">Paste full Q&A Transcript</label>
                  <Textarea 
                    value={transcriptC} 
                    onChange={e => setTranscriptC(e.target.value)} 
                    placeholder="Q1: Tell me about your friends.&#10;A1: My friends are supportive.&#10;Q2: What do you do when you disagree with them?&#10;A2: We talk it out."
                    className={`glass-input min-h-[250px] font-mono text-sm pb-10 ${activeMic === 'transcriptC' ? 'border-primary shadow-[0_0_15px_rgba(234,179,8,0.3)]' : ''}`}
                  />
                  <button 
                    onClick={() => toggleMic('transcriptC', setTranscriptC)} 
                    className={`absolute bottom-3 right-3 p-2 rounded-full transition-all ${activeMic === 'transcriptC' ? 'bg-red-500/20 text-red-500 animate-pulse' : 'bg-transparent text-muted-foreground hover:bg-gold/10 hover:text-gold'}`}
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                </div>
                
                <button
                  onClick={handleModeC}
                  disabled={loadingC || !transcriptC.trim()}
                  className="glass-button-gold w-full flex items-center justify-center gap-2 py-3"
                >
                  {loadingC ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                  {loadingC ? 'Evaluating Candidate Psych Profile...' : 'Analyze Full Transcript'}
                </button>
              </div>

              {resultC ? (
                <div className="space-y-4">
                  <AnalysisOutput content={resultC} title="Comprehensive Interview Report" />
                  <button onClick={() => { setResultC(''); setTranscriptC(''); }} className="glass-button text-xs px-4 py-2 hover:border-destructive hover:text-destructive flex items-center justify-center gap-2 w-full mx-auto max-w-sm mt-4">
                    <Trash2 className="h-4 w-4" /> Delete & Reset Transcript
                  </button>
                </div>
              ) : null}
            </div>
          )}

        </div>
      </div>
    </PageTransition>
  );
}
