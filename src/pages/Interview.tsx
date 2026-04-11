import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAppStore } from '@/lib/store';
import { callGemini, callGeminiMultiPart, buildInterviewModeAPrompt, buildInterviewModeBPrompt, buildInterviewModeCPrompt } from '@/lib/gemini';
import { MessageSquare, RefreshCw, ChevronRight, Loader2, Target, Users, Mic, Trash2, StopCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { AnalysisOutput } from '@/components/AnalysisOutput';
import PageTransition from '@/components/PageTransition';

import intImg1 from '@/assets/interview/int-1.jpg';
import intImg2 from '@/assets/interview/int-2.jpg';
import intImg3 from '@/assets/interview/int-3.png';

const INT_IMAGES = [intImg1, intImg2, intImg3];

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

  // Audio Recording (Lecturette style)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingMode, setRecordingMode] = useState<'A' | 'B' | 'C' | null>(null);
  const recordingModeRef = useRef<'A' | 'B' | 'C' | null>(null);

  const [videoBlobA, setVideoBlobA] = useState<Blob | null>(null);
  const [videoUrlA, setVideoUrlA] = useState<string | null>(null);
  const [videoBlobB, setVideoBlobB] = useState<Blob | null>(null);
  const [videoUrlB, setVideoUrlB] = useState<string | null>(null);
  const [videoBlobC, setVideoBlobC] = useState<Blob | null>(null);
  const [videoUrlC, setVideoUrlC] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
    setRecordingMode(null);
  }, []);

  const startRecording = useCallback(async (mode: 'A' | 'B' | 'C') => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        if (recordingModeRef.current === 'A') { setVideoBlobA(blob); setVideoUrlA(url); }
        if (recordingModeRef.current === 'B') { setVideoBlobB(blob); setVideoUrlB(url); }
        if (recordingModeRef.current === 'C') { setVideoBlobC(blob); setVideoUrlC(url); }
        stream.getTracks().forEach(t => t.stop());
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingMode(mode);
      recordingModeRef.current = mode;
      setRecordingTime(0);
      
      if (mode === 'A') { setVideoBlobA(null); setVideoUrlA(null); setResultA(''); }
      if (mode === 'B') { setVideoBlobB(null); setVideoUrlB(null); setResultB(''); }
      if (mode === 'C') { setVideoBlobC(null); setVideoUrlC(null); setResultC(''); }

      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 600) { stopRecording(); return 600; }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      alert('Microphone access denied. Please allow mic access.');
    }
  }, [stopRecording]);

  const analyzeRecordedA = async () => {
    if (!videoBlobA || !questionA.trim()) { alert('Need question and recording'); return; }
    setLoadingA(true);
    setResultA('');
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => { reader.onload = () => resolve(reader.result as string); reader.readAsDataURL(videoBlobA); });
      const base64 = await base64Promise;
      const response = await callGeminiMultiPart(
        buildInterviewModeAPrompt(questionA, "The candidate has recorded their answer as an audio clip. Transcribe and evaluate their spoken answer exactly as if it was written, but prioritize spoken fluency and pauses as well."),
        [{ base64, mimeType: 'audio/webm' }]
      );
      setResultA(response);
    } catch (e: any) { alert(e.message); } finally { setLoadingA(false); }
  };

  const analyzeRecordedB = async () => {
    if (!videoBlobB) { alert('Need recording'); return; }
    setLoadingB(true);
    setResultB('');
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => { reader.onload = () => resolve(reader.result as string); reader.readAsDataURL(videoBlobB); });
      const base64 = await base64Promise;
      const response = await callGeminiMultiPart(
        buildInterviewModeBPrompt("The candidate has stated this in an audio recording. Transcribe and process it as their claim."),
        [{ base64, mimeType: 'audio/webm' }]
      );
      setResultB(response);
    } catch (e: any) { alert(e.message); } finally { setLoadingB(false); }
  };

  const analyzeRecordedC = async () => {
    if (!videoBlobC) { alert('Need transcript recording'); return; }
    setLoadingC(true);
    setResultC('');
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => { reader.onload = () => resolve(reader.result as string); reader.readAsDataURL(videoBlobC); });
      const base64 = await base64Promise;
      const response = await callGeminiMultiPart(
        buildInterviewModeCPrompt("The candidate uploaded a full audio mock interview. Transcribe the conversation, detect the IO vs Candidate tone, and evaluate the full transcript."),
        [{ base64, mimeType: 'audio/webm' }]
      );
      setResultC(response);
    } catch (e: any) { alert(e.message); } finally { setLoadingC(false); }
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
      <div className="space-y-6 scroll-reveal pb-12">
        {/* Header Banner */}
        <div className="glass-card glow-gold relative overflow-hidden">
          {INT_IMAGES.map((src, i) => (
            <div
              key={i}
              className="absolute inset-0 transition-opacity duration-[2000ms] ease-in-out"
              style={{
                opacity: currentImage === i ? 0.25 : 0,
                backgroundImage: `url(${src})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center 30%',
              }}
            />
          ))}
          <div className="absolute inset-0 bg-background/50 blur-[2px]" />
          <div className="relative z-10">
            <h1 className="text-2xl md:text-3xl font-heading font-bold mb-2">
              <span className="shimmer-text">Interview Practice</span>
            </h1>
            <p className="text-muted-foreground font-body text-sm max-w-2xl leading-relaxed">
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
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-heading font-semibold text-muted-foreground block">Voice Record Your Answer</label>
                  {!isRecording && !videoUrlA && (
                    <button onClick={() => startRecording('A')} className="glass-button-gold flex items-center justify-center gap-2 py-3 border-dashed">
                      <Mic className="h-4 w-4" /> Start Audio Recording
                    </button>
                  )}
                  {isRecording && recordingMode === 'A' && (
                    <div className="glass-card-subtle flex flex-col items-center justify-center gap-3 py-6 border-destructive/30">
                      <div className="flex items-center gap-2 text-destructive font-heading font-bold animate-pulse">
                        <div className="w-3 h-3 rounded-full bg-destructive" />
                        Recording... {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}
                      </div>
                      <button onClick={stopRecording} className="glass-button w-48 border-destructive text-destructive hover:bg-destructive hover:text-white flex items-center justify-center gap-2">
                        <StopCircle className="h-4 w-4" /> Stop Recording
                      </button>
                    </div>
                  )}
                  {videoUrlA && !isRecording && (
                    <div className="space-y-3">
                      <audio src={videoUrlA} controls className="w-full h-10 border border-gold/20 rounded-md" />
                      <button onClick={analyzeRecordedA} disabled={loadingA} className="glass-button-gold w-full flex items-center justify-center gap-2 py-3">
                        {loadingA ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                        {loadingA ? 'Analyzing...' : 'Analyze My Recorded Answer'}
                      </button>
                      <button onClick={() => { setVideoBlobA(null); setVideoUrlA(null); }} className="text-xs text-muted-foreground hover:text-destructive flex items-center justify-center gap-2 w-full mt-2">
                        <Trash2 className="h-3 w-3" /> Discard Recording
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-border/30" />
                  <span className="text-xs text-muted-foreground font-body">OR paste text</span>
                  <div className="flex-1 h-px bg-border/30" />
                </div>

                <div>
                  <label className="text-sm font-heading font-semibold text-muted-foreground mb-1 block">Your Answer</label>
                  <Textarea 
                    value={answerA} 
                    onChange={e => setAnswerA(e.target.value)} 
                    placeholder="Type your exact response here..."
                    className="glass-input min-h-[120px]"
                  />
                </div>
                {answerA.trim() && (
                  <button
                    onClick={handleModeA}
                    disabled={loadingA || !questionA.trim()}
                    className="glass-button-gold w-full flex items-center justify-center gap-2 py-3"
                  >
                    {loadingA ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                    {loadingA ? 'Analyzing Response...' : 'Improve Typed Answer'}
                  </button>
                )}
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
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-heading font-semibold text-muted-foreground block">Voice Record Your Statement</label>
                  {!isRecording && !videoUrlB && (
                    <button onClick={() => startRecording('B')} className="glass-button-gold flex items-center justify-center gap-2 py-3 border-dashed">
                      <Mic className="h-4 w-4" /> Start Audio Recording
                    </button>
                  )}
                  {isRecording && recordingMode === 'B' && (
                    <div className="glass-card-subtle flex flex-col items-center justify-center gap-3 py-6 border-destructive/30">
                      <div className="flex items-center gap-2 text-destructive font-heading font-bold animate-pulse">
                        <div className="w-3 h-3 rounded-full bg-destructive" />
                        Recording... {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}
                      </div>
                      <button onClick={stopRecording} className="glass-button w-48 border-destructive text-destructive hover:bg-destructive hover:text-white flex items-center justify-center gap-2">
                        <StopCircle className="h-4 w-4" /> Stop Recording
                      </button>
                    </div>
                  )}
                  {videoUrlB && !isRecording && (
                    <div className="space-y-3">
                      <audio src={videoUrlB} controls className="w-full h-10 border border-gold/20 rounded-md" />
                      <button onClick={analyzeRecordedB} disabled={loadingB} className="glass-button-gold w-full flex items-center justify-center gap-2 py-3">
                        {loadingB ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                        {loadingB ? 'Thinking like the IO...' : 'Generate Cross-Questions from Audio'}
                      </button>
                      <button onClick={() => { setVideoBlobB(null); setVideoUrlB(null); }} className="text-xs text-muted-foreground hover:text-destructive flex items-center justify-center gap-2 w-full mt-2">
                        <Trash2 className="h-3 w-3" /> Discard Recording
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-border/30" />
                  <span className="text-xs text-muted-foreground font-body">OR paste text</span>
                  <div className="flex-1 h-px bg-border/30" />
                </div>

                <div>
                  <label className="text-sm font-heading font-semibold text-muted-foreground mb-1 block">Statement or Claim you plan to make</label>
                  <Textarea 
                    value={statementB} 
                    onChange={e => setStatementB(e.target.value)} 
                    placeholder="e.g. I am a highly motivated person and a natural leader because I was the captain of my college sports team."
                    className="glass-input min-h-[120px]"
                  />
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Target className="h-3 w-3" /> The IO will use this statement against you. Let's see how.
                  </p>
                </div>
                
                {statementB.trim() && (
                  <button
                    onClick={handleModeB}
                    disabled={loadingB}
                    className="glass-button-gold w-full flex items-center justify-center gap-2 py-3"
                  >
                    {loadingB ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                    {loadingB ? 'Thinking like the IO...' : 'Generate Cross-Questions'}
                  </button>
                )}
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
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-heading font-semibold text-muted-foreground block">Voice Record Mock Interview</label>
                  {!isRecording && !videoUrlC && (
                    <button onClick={() => startRecording('C')} className="glass-button-gold flex items-center justify-center gap-2 py-3 border-dashed">
                      <Mic className="h-4 w-4" /> Start Audio Recording
                    </button>
                  )}
                  {isRecording && recordingMode === 'C' && (
                    <div className="glass-card-subtle flex flex-col items-center justify-center gap-3 py-6 border-destructive/30">
                      <div className="flex items-center gap-2 text-destructive font-heading font-bold animate-pulse">
                        <div className="w-3 h-3 rounded-full bg-destructive" />
                        Recording... {Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, '0')}
                      </div>
                      <button onClick={stopRecording} className="glass-button w-48 border-destructive text-destructive hover:bg-destructive hover:text-white flex items-center justify-center gap-2">
                        <StopCircle className="h-4 w-4" /> Stop Recording
                      </button>
                    </div>
                  )}
                  {videoUrlC && !isRecording && (
                    <div className="space-y-3">
                      <audio src={videoUrlC} controls className="w-full h-10 border border-gold/20 rounded-md" />
                      <button onClick={analyzeRecordedC} disabled={loadingC} className="glass-button-gold w-full flex items-center justify-center gap-2 py-3">
                        {loadingC ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                        {loadingC ? 'Evaluating Profile...' : 'Analyze Recorded Transcript'}
                      </button>
                      <button onClick={() => { setVideoBlobC(null); setVideoUrlC(null); }} className="text-xs text-muted-foreground hover:text-destructive flex items-center justify-center gap-2 w-full mt-2">
                        <Trash2 className="h-3 w-3" /> Discard Recording
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 my-2">
                  <div className="flex-1 h-px bg-border/30" />
                  <span className="text-xs text-muted-foreground font-body">OR paste text transcript</span>
                  <div className="flex-1 h-px bg-border/30" />
                </div>

                <div>
                  <label className="text-sm font-heading font-semibold text-muted-foreground mb-1 block">Paste Q&A Transcript</label>
                  <Textarea 
                    value={transcriptC} 
                    onChange={e => setTranscriptC(e.target.value)} 
                    placeholder="Q1: Tell me about your friends.&#10;A1: My friends are supportive.&#10;Q2: What do you do when you disagree with them?&#10;A2: We talk it out."
                    className="glass-input min-h-[250px] font-mono text-sm"
                  />
                </div>
                
                {transcriptC.trim() && (
                  <button
                    onClick={handleModeC}
                    disabled={loadingC}
                    className="glass-button-gold w-full flex items-center justify-center gap-2 py-3"
                  >
                    {loadingC ? <Loader2 className="h-4 w-4 animate-spin" /> : <ChevronRight className="h-4 w-4" />}
                    {loadingC ? 'Evaluating Candidate Psych Profile...' : 'Analyze Full Transcript'}
                  </button>
                )}
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
