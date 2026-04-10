import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { callGemini, callGeminiMultiPart, buildFullReportPrompt, buildFullPdfAnalysisPrompt, buildPiqPsychMatchPrompt, fileToBase64 } from '@/lib/gemini';
import { LoadingCard } from '@/components/LoadingCard';
import { AnalysisOutput } from '@/components/AnalysisOutput';
import { useHistorySave } from '@/hooks/useHistorySave';
import { Upload, BarChart3, Target, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function FullAnalysisPage() {
  const store = useAppStore();
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [potentialLoading, setPotentialLoading] = useState(false);
  const [potentialReport, setPotentialReport] = useState('');
  const { saveToHistory } = useHistorySave();

  const hasIndividualData = !!(
    store.tatSummary || store.tatStories.some(s => s.analysis) ||
    store.watSummary || store.srtSummary ||
    store.sdSummary || store.sdParagraphs.some(p => p.analysis)
  );

  const hasPiq = !!store.piqContext;
  const canGeneratePotential = hasPiq && hasIndividualData;

  const generateFullReport = async () => {
    setLoading(true);
    try {
      const prompt = buildFullReportPrompt(
        store.piqContext,
        store.tatSummary || store.tatStories.filter(s => s.analysis).map(s => s.analysis).join('\n\n'),
        store.watSummary,
        store.srtSummary,
        store.sdSummary || store.sdParagraphs.filter(p => p.analysis).map(p => p.analysis).join('\n\n')
      );
      const result = await callGemini(prompt);
      store.setFullReport(result);
      saveToHistory('Full-Report', {}, result);
      toast.success('Full psychological report generated');
    } catch (err: any) {
      toast.error(err.message || 'Report generation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFullPdfUpload = async (file: File) => {
    setPdfLoading(true);
    try {
      const base64 = await fileToBase64(file);
      const result = await callGeminiMultiPart(buildFullPdfAnalysisPrompt(), [{ base64, mimeType: 'application/pdf' }]);
      store.setFullReport(result);
      saveToHistory('Full-PDF', { fileName: file.name }, result);
      toast.success('Full psych analysis from PDF complete');
    } catch (err: any) {
      toast.error(err.message || 'PDF analysis failed');
    } finally {
      setPdfLoading(false);
    }
  };

  const generatePotentialAssessment = async () => {
    setPotentialLoading(true);
    try {
      const prompt = buildPiqPsychMatchPrompt(
        store.piqContext,
        store.tatSummary || store.tatStories.filter(s => s.analysis).map(s => s.analysis).join('\n\n'),
        store.watSummary,
        store.srtSummary,
        store.sdSummary || store.sdParagraphs.filter(p => p.analysis).map(p => p.analysis).join('\n\n')
      );
      const result = await callGemini(prompt);
      setPotentialReport(result);
      saveToHistory('PIQ-Psych-Match', {}, result);
      toast.success('Potential assessment generated');
    } catch (err: any) {
      toast.error(err.message || 'Assessment failed');
    } finally {
      setPotentialLoading(false);
    }
  };

  return (
    <div className="space-y-6 scroll-reveal">
      <div className="gold-border-left">
        <h1 className="text-2xl">Full Psych Analysis</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">
          Upload a single PDF with all tests or combine individual analyses into one comprehensive report.
        </p>
      </div>
      <div className="gold-stripe" />

      {/* Full PDF Upload */}
      <div className="glass-card glow-gold">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <h3 className="text-base font-heading font-bold text-gold mb-1">Upload Complete Psych Test (Single PDF)</h3>
            <p className="text-xs text-muted-foreground font-body leading-relaxed">
              Upload one PDF with all your tests. Make sure each section has a <strong className="text-foreground">clear heading</strong> at the top:
            </p>
            <ul className="text-xs text-muted-foreground font-body mt-2 space-y-1">
              <li>• <strong className="text-foreground">TAT</strong> — Story 1, Story 2, etc.</li>
              <li>• <strong className="text-foreground">WAT</strong> — Two columns: Word | Sentence</li>
              <li>• <strong className="text-foreground">SRT</strong> — Two columns: Situation | Reaction</li>
              <li>• <strong className="text-foreground">SD</strong> — Each paragraph labeled</li>
            </ul>
          </div>
          <button onClick={() => document.getElementById('full-pdf')?.click()} disabled={pdfLoading}
            className="glass-button-gold flex items-center gap-2">
            <Upload className="h-4 w-4" />
            {pdfLoading ? 'Analyzing...' : 'Upload Full PDF'}
          </button>
          <input id="full-pdf" type="file" accept="application/pdf" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) { handleFullPdfUpload(f); e.target.value = ''; } }} />
        </div>
      </div>

      {pdfLoading && <LoadingCard message="Analyzing complete psychological test data..." />}

      {/* Combine Individual Analyses */}
      {hasIndividualData && (
        <div className="glass-card">
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 className="h-5 w-5 text-gold" />
            <h3 className="text-base font-heading font-bold text-foreground">Combine Individual Analyses</h3>
          </div>
          <p className="text-xs text-muted-foreground font-body mb-4">
            You have individual test analyses in your session. Generate a combined report that identifies overlapping traits and consistency across all tests.
          </p>
          <button onClick={generateFullReport} disabled={loading}
            className="w-full glass-button-gold py-3.5 disabled:opacity-40 glow-gold">
            {loading ? 'GENERATING REPORT...' : 'GENERATE COMBINED REPORT'}
          </button>
        </div>
      )}

      {loading && <LoadingCard message="Generating comprehensive SSB assessment..." />}

      {store.fullReport && !loading && !pdfLoading && (
        <AnalysisOutput content={store.fullReport} title="Comprehensive SSB Psychological Assessment" />
      )}

      {/* PIQ + Psych Cross-Match — Potential Assessment */}
      <div className="gold-stripe" />
      
      <div className="glass-card border-2 border-gold/30" style={{
        background: 'linear-gradient(135deg, hsl(var(--gold) / 0.05), hsl(var(--card) / 0.8))',
      }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, hsl(var(--gold) / 0.25), hsl(var(--gold) / 0.1))',
          }}>
            <Target className="h-5 w-5 text-gold" />
          </div>
          <div>
            <h3 className="text-base font-heading font-bold text-gold">PIQ + Psych Test — Potential Assessment</h3>
            <p className="text-xs text-muted-foreground font-body">The ultimate SSB readiness check</p>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground font-body leading-relaxed mb-3">
          This is the <strong className="text-foreground">Mansa-Vacha-Karma alignment check</strong> — does what you <em>claim</em> about yourself (PIQ) match what your <em>subconscious</em> reveals in tests (TAT, WAT, SRT, SD)? The SSB psychologist does exactly this cross-match.
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`olq-badge text-[10px] ${hasPiq ? 'border-success/50 text-success' : 'border-destructive/50 text-destructive'}`}>
            {hasPiq ? '✓' : '✗'} PIQ Analyzed
          </span>
          <span className={`olq-badge text-[10px] ${hasIndividualData ? 'border-success/50 text-success' : 'border-destructive/50 text-destructive'}`}>
            {hasIndividualData ? '✓' : '✗'} Psych Tests Done
          </span>
        </div>

        {!canGeneratePotential && (
          <div className="glass-card-subtle border-gold/10 mb-4">
            <p className="text-xs text-muted-foreground font-body">
              <strong className="text-gold">Required:</strong> Analyze your PIQ first, then complete at least one psych test (TAT/WAT/SRT/SD). The more tests you complete, the more accurate the potential assessment.
            </p>
          </div>
        )}

        {potentialReport && !potentialLoading ? (
          <>
            <div className="glass-card-subtle border-gold/20 text-center py-3 mb-4">
              <p className="font-heading text-xs text-gold mb-2">✓ Potential assessment generated</p>
              <button onClick={generatePotentialAssessment} disabled={potentialLoading || !canGeneratePotential}
                className="glass-button-accent text-xs py-2">
                Regenerate Assessment
              </button>
            </div>
          </>
        ) : (
          <button onClick={generatePotentialAssessment} disabled={potentialLoading || !canGeneratePotential}
            className="w-full glass-button-gold py-3.5 disabled:opacity-40 glow-gold flex items-center justify-center gap-2">
            <ShieldCheck className="h-4 w-4" />
            {potentialLoading ? 'ASSESSING POTENTIAL...' : 'ASSESS MY SSB POTENTIAL'}
          </button>
        )}
      </div>

      {potentialLoading && <LoadingCard message="Cross-matching PIQ with psych tests... calculating SSB potential..." />}
      
      {potentialReport && !potentialLoading && (
        <AnalysisOutput content={potentialReport} title="PIQ + Psych Test — SSB Potential Assessment" />
      )}
    </div>
  );
}
