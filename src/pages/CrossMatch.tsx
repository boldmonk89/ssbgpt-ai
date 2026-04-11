import { useState } from 'react';
import { callGeminiMultiPart, fileToBase64 } from '@/lib/gemini';
import { LoadingCard } from '@/components/LoadingCard';
import { AnalysisOutput } from '@/components/AnalysisOutput';
import { Upload, Target, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useHistorySave } from '@/hooks/useHistorySave';

const CROSS_MATCH_PROMPT = `You are a Senior SSB Psychologist performing a deep cross-match analysis.

You have been given TWO documents:
1. The candidate's PIQ (Personal Information Questionnaire) form
2. The candidate's complete Psych test responses (TAT / WAT / SRT / SD)

STEP 1 — Extract PIQ Profile: identify all key self-claims, achievements, qualities, strengths, weaknesses, goals, and the image the candidate is projecting.

STEP 2 — Extract Psych Test Profile: analyse TAT stories for themes and hero traits, WAT for dominant thought patterns, SRT for instinctive behaviour under pressure, SD for self-awareness and social perception.

STEP 3 — Cross-Match: for each major PIQ claim, check if Psych tests confirm or contradict it. Rate each as: ✅ CONFIRMED | ⚠️ PARTIALLY CONFIRMED | ❌ CONTRADICTED

STEP 4 — OLQ Assessment: rate the candidate on all 15 OLQs (score 1–10) based on Psych test data only. Then compare: where does PIQ overclaim vs what psyche reveals?

STEP 5 — Final Verdict:
- Overall PIQ-Psych Alignment Score (out of 100)
- Top 3 strengths genuinely reflected in both
- Top 3 red flags — claimed in PIQ but not reflected in psych
- Recommendation: Recommend / Borderline / Not Recommended

Be direct, clinical, and honest. Do not sugar-coat.`;

export default function CrossMatchPage() {
  const [piqFile, setPiqFile] = useState<File | null>(null);
  const [psychFile, setPsychFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const { saveToHistory } = useHistorySave();

  const handleClear = () => {
    setResult('');
    setPiqFile(null);
    setPsychFile(null);
    if (document.getElementById('piq-upload')) (document.getElementById('piq-upload') as HTMLInputElement).value = '';
    if (document.getElementById('psych-upload')) (document.getElementById('psych-upload') as HTMLInputElement).value = '';
  };

  const handleAnalyse = async () => {
    if (!piqFile || !psychFile) { toast.error('Upload both PDFs first'); return; }
    setLoading(true);
    try {
      const [piqBase64, psychBase64] = await Promise.all([fileToBase64(piqFile), fileToBase64(psychFile)]);
      const output = await callGeminiMultiPart(CROSS_MATCH_PROMPT, [
        { base64: piqBase64, mimeType: 'application/pdf' },
        { base64: psychBase64, mimeType: 'application/pdf' },
      ]);
      setResult(output);
      saveToHistory('PIQ-Psych-CrossMatch', { piqFile: piqFile.name, psychFile: psychFile.name }, output);
      toast.success('Cross-match analysis complete');
    } catch (error) {
      const err = error as Error;
      toast.error(err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const FileCard = ({ label, file, inputId, onFile }: { label: string; file: File | null; inputId: string; onFile: (f: File) => void }) => (
    <div className="glass-card flex items-center justify-between gap-4 flex-wrap">
      <div>
        <p className="text-sm font-heading font-bold text-foreground">{label}</p>
        {file ? <p className="text-xs text-success mt-1">✓ {file.name}</p> : <p className="text-xs text-muted-foreground mt-1">No file selected</p>}
      </div>
      <button onClick={() => document.getElementById(inputId)?.click()} className="glass-button-gold flex items-center gap-2">
        {file ? 'Replace' : 'Upload PDF'}
      </button>
      <input id={inputId} type="file" accept="application/pdf" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) { onFile(f); e.target.value = ''; } }} />
    </div>
  );

  return (
    <div className="space-y-6 scroll-reveal">
      <div className="gold-border-left">
        <h1 className="text-2xl">PIQ × Psych Cross-Match</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">Upload your PIQ form and complete Psych test — get a deep alignment analysis like the actual SSB psychologist does.</p>
      </div>
      <div className="gold-stripe" />
      <div className="glass-card border-2 border-gold/30 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-5 w-5 text-gold" />
          <h3 className="font-heading font-bold text-gold">Mansa-Vacha-Karma Alignment Check</h3>
        </div>
        <p className="text-xs text-muted-foreground font-body leading-relaxed">
          The SSB psychologist compares what you <strong className="text-foreground">claim</strong> in your PIQ with what your <strong className="text-foreground">subconscious reveals</strong> in TAT/WAT/SRT/SD. Upload both as PDFs and get an honest, clinical report.
        </p>
      </div>
      <FileCard label="PDF 1 — PIQ Form (filled)" file={piqFile} inputId="piq-upload" onFile={setPiqFile} />
      <FileCard label="PDF 2 — Complete Psych Test (TAT + WAT + SRT + SD)" file={psychFile} inputId="psych-upload" onFile={setPsychFile} />
      
      {result && !loading ? (
        <div className="glass-card-subtle border-gold/20 text-center py-3">
          <p className="font-heading text-xs text-gold">✓ Analysis Already Done</p>
        </div>
      ) : (
        <button onClick={handleAnalyse} disabled={loading || !piqFile || !psychFile}
          className="w-full glass-button-gold py-3.5 disabled:opacity-40 glow-gold flex items-center justify-center gap-2">
          {loading ? 'CROSS-MATCHING...' : 'RUN CROSS-MATCH ANALYSIS'}
        </button>
      )}

      {loading && <LoadingCard message="Cross-matching PIQ with Psych tests..." />}
      {result && !loading && <AnalysisOutput content={result} title="PIQ × Psych Cross-Match Report" />}
    </div>
  );
}
