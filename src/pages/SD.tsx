import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { callGemini, callGeminiMultiPart, buildSdPrompt, buildSdFromPdfPrompt, fileToBase64 } from '@/lib/gemini';
import { validateParagraph } from '@/lib/validation';
import { detectGibberish } from '@/lib/gibberishDetector';
import { LoadingCard } from '@/components/LoadingCard';
import { AnalysisOutput } from '@/components/AnalysisOutput';
import { useHistorySave } from '@/hooks/useHistorySave';
import { FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const SD_LABELS = ['Parents', 'Teachers', 'Friends', 'Self', 'Develop'];

export default function SDPage() {
  const { sdParagraphs, updateSdParagraph, sdSummary, setSdSummary } = useAppStore();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const { saveToHistory } = useHistorySave();
  const navigate = useNavigate();

  const para = sdParagraphs[activeTab];

  const handleClear = () => {
    updateSdParagraph(activeTab, { content: '', analysis: null });
    setSdSummary(null);
    if (document.getElementById('sd-pdf')) (document.getElementById('sd-pdf') as HTMLInputElement).value = '';
  };

  const analyzeParagraph = async () => {
    const gibberishMsg = detectGibberish(para.content);
    if (gibberishMsg) {
      updateSdParagraph(activeTab, { analysis: gibberishMsg });
      return;
    }
    const v = validateParagraph(para.content);
    if (!v.valid) { toast.error(v.message!); return; }


    setLoading(true);
    try {
      const result = await callGemini(buildSdPrompt(para.type, para.content));

      updateSdParagraph(activeTab, { analysis: result.replace(/\*/g, '') });
      saveToHistory('SD', { type: para.type, content: para.content }, result);
      toast.success('SD paragraph analyzed');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePdfUpload = async (file: File) => {
    setPdfLoading(true);
    try {
      const base64 = await fileToBase64(file);
      const result = await callGeminiMultiPart(buildSdFromPdfPrompt(), [{ base64, mimeType: 'application/pdf' }]);

      setSdSummary(result);
      saveToHistory('SD-PDF', { fileName: file.name }, result);
      toast.success('Full SD PDF analyzed');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'PDF analysis failed');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="space-y-6 scroll-reveal">
      <div className="gold-border-left">
        <h1 className="text-2xl">SD — Self Description</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">
          Write each paragraph or upload your full SD as a PDF.
        </p>
      </div>
      <div className="gold-stripe" />

      {/* PDF Upload */}
      <div className="glass-card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-heading font-semibold text-sm text-foreground">Upload Full SD (PDF)</p>
            <p className="text-xs text-muted-foreground font-body mt-0.5">All 5 paragraphs for batch analysis.</p>
          </div>
          <button onClick={() => document.getElementById('sd-pdf')?.click()} disabled={pdfLoading}
            className="glass-button-accent text-xs">
            {pdfLoading ? 'Analyzing...' : 'Upload SD PDF'}
          </button>
          <input id="sd-pdf" type="file" accept="application/pdf" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) { handlePdfUpload(f); e.target.value = ''; } }} />
        </div>
      </div>

      {pdfLoading && <LoadingCard message="Analyzing full SD PDF..." />}
      {sdSummary && !pdfLoading && <AnalysisOutput content={sdSummary} title="Full SD Analysis" />}

      <div className="gold-stripe" />
      <p className="font-heading font-semibold text-xs text-gold uppercase tracking-wider">Or Analyze Paragraph by Paragraph</p>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {sdParagraphs.map((p, i) => (
          <button key={i} onClick={() => setActiveTab(i)}
            className={`px-4 py-2.5 text-xs font-heading font-bold rounded-xl transition-all duration-300 ${
              i === activeTab
                ? 'glass-button-gold glow-gold'
                : p.analysis
                  ? 'glass-button-accent'
                  : 'glass-button bg-card/40 text-muted-foreground hover:text-foreground border border-border/40'
            }`}>
            {SD_LABELS[i]}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="glass-card">
            <p className="text-xs font-heading font-semibold text-gold mb-3 uppercase tracking-wider">{para.type}</p>
            <textarea
              value={para.content}
              onChange={(e) => updateSdParagraph(activeTab, { content: e.target.value })}
              placeholder={`Write what ${activeTab < 3 ? 'they' : 'you'} think...`}
              rows={10}
              className="glass-input resize-y leading-relaxed"
            />
          </div>
          {para.analysis && !loading ? (
            <div className="glass-card-subtle border-gold/20 text-center py-3">
              <p className="font-heading text-xs text-gold">✓ Analysis Already Done</p>
            </div>
          ) : (
            <button onClick={analyzeParagraph} disabled={!para.content.trim() || loading}
              className="w-full glass-button-gold py-3.5 disabled:opacity-40 glow-gold">
              {loading ? 'ANALYZING...' : 'ANALYZE PARAGRAPH'}
            </button>
          )}
        </div>

        <div>
          {loading ? (
            <LoadingCard message="Evaluating authenticity... checking OLQ coverage..." />
          ) : para.analysis ? (
            <AnalysisOutput content={para.analysis} title={`${para.type} — Analysis`} />
          ) : (
            <div className="glass-card flex items-center justify-center min-h-[200px] text-muted-foreground font-heading text-sm">
              Analysis will appear here
            </div>
          )}
        </div>
      </div>

      </div>
  );
}
