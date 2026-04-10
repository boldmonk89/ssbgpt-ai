import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { callGemini, callGeminiMultiPart, buildSrtPrompt, buildSrtPdfPrompt, buildExtractSrtFromImagePrompt, fileToBase64 } from '@/lib/gemini';
import { detectGibberish } from '@/lib/gibberishDetector';
import { LoadingCard } from '@/components/LoadingCard';
import { AnalysisOutput } from '@/components/AnalysisOutput';
import { useHistorySave } from '@/hooks/useHistorySave';
import { Trash2, ImageIcon, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function SRTPage() {
  const { srtResponses, setSrtResponses, srtSummary, setSrtSummary } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [genCount, setGenCount] = useState(0);
  const { saveToHistory } = useHistorySave();

  const rows = srtResponses.length > 0 ? srtResponses : [{ situationNumber: 1, situation: '', response: '' }];

  const handleClear = () => {
    setSrtSummary(null);
    setSrtResponses([{ situationNumber: 1, situation: '', response: '' }]);
    setGenCount(0);
    if (document.getElementById('srt-images')) (document.getElementById('srt-images') as HTMLInputElement).value = '';
    if (document.getElementById('srt-pdf')) (document.getElementById('srt-pdf') as HTMLInputElement).value = '';
  };

  const updateRow = (i: number, field: 'situation' | 'response', value: string) => {
    const updated = [...rows];
    updated[i] = { ...updated[i], [field]: value };
    if (i === updated.length - 1 && (updated[i].situation.trim() || updated[i].response.trim())) {
      updated.push({ situationNumber: updated.length + 1, situation: '', response: '' });
    }
    setSrtResponses(updated);
  };

  const removeRow = (i: number) => {
    const updated = rows.filter((_, idx) => idx !== i).map((r, idx) => ({ ...r, situationNumber: idx + 1 }));
    setSrtResponses(updated.length > 0 ? updated : [{ situationNumber: 1, situation: '', response: '' }]);
  };

  const handleImageUpload = async (files: FileList) => {
    setExtracting(true);
    try {
      let allParsed: { situation: string; response: string }[] = [];
      for (const file of Array.from(files)) {
        const base64 = await fileToBase64(file);
        const result = await callGemini(buildExtractSrtFromImagePrompt(), base64);
        const jsonMatch = result.match(/\[[\s\S]*\]/);
        if (jsonMatch) allParsed = [...allParsed, ...JSON.parse(jsonMatch[0])];
      }
      if (allParsed.length > 0) {
        const existing = rows.filter(r => r.situation.trim() || r.response.trim());
        const startNum = existing.length + 1;
        const newRows = allParsed.map((p, i) => ({ situationNumber: startNum + i, situation: p.situation, response: p.response }));
        setSrtResponses([...existing, ...newRows, { situationNumber: existing.length + newRows.length + 1, situation: '', response: '' }]);
        toast.success(`Extracted ${allParsed.length} SRT responses`);
      } else {
        toast.error('Could not extract SRT responses.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to extract');
    } finally {
      setExtracting(false);
    }
  };

  const handlePdfUpload = async (file: File) => {
    setPdfLoading(true);
    try {
      const base64 = await fileToBase64(file);
      const result = await callGeminiMultiPart(buildSrtPdfPrompt(), [{ base64, mimeType: file.type === 'application/pdf' ? 'application/pdf' : 'image/jpeg' }]);
      setSrtSummary(result);
      saveToHistory('SRT-PDF', { fileName: file.name }, result);
      toast.success('Full SRT analyzed');
    } catch (err: any) {
      toast.error(err.message || 'Analysis failed');
    } finally {
      setPdfLoading(false);
    }
  };

  const filledRows = rows.filter(r => r.situation.trim() && r.response.trim());

  const analyzeAll = async () => {
    if (filledRows.length === 0) { toast.error('Type some SRT responses first.'); return; }
    const allResponses = filledRows.map(r => r.response).join(' ');
    const gibberishMsg = detectGibberish(allResponses);
    if (gibberishMsg) {
      setSrtSummary(gibberishMsg);
      return;
    }
    setLoading(true);
    setGenCount(prev => prev + 1);
    try {
      const result = await callGemini(buildSrtPrompt(filledRows));
      setSrtSummary(result);
      saveToHistory('SRT', { responses: filledRows }, result);
      toast.success('SRT analysis complete');
    } catch (err: any) {
      toast.error(err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 scroll-reveal">
      <div className="gold-border-left">
        <h1 className="text-2xl">SRT — Situation Reaction Test</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">
          Type responses below, upload handwritten sheets, or upload full SRT PDF.
        </p>
      </div>
      <div className="gold-stripe" />

      {/* Full PDF Upload */}
      <div className="glass-card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-heading font-semibold text-sm text-foreground">Full SRT Review (PDF / Image)</p>
            <p className="text-xs text-muted-foreground font-body mt-0.5">Upload complete SRT for batch analysis.</p>
          </div>
          <button onClick={() => document.getElementById('srt-pdf')?.click()} disabled={pdfLoading}
            className="glass-button-accent text-xs">
            <FileText className="h-4 w-4 inline mr-1.5" />
            {pdfLoading ? 'Analyzing...' : 'Upload SRT PDF'}
          </button>
          <input id="srt-pdf" type="file" accept="application/pdf,image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) { handlePdfUpload(f); e.target.value = ''; } }} />
        </div>
      </div>

      {pdfLoading && <LoadingCard message="Analyzing full SRT..." />}
      {srtSummary && !pdfLoading && !loading && (
        <div className="relative">
          <div className="absolute top-4 right-4 z-10">
            <button onClick={handleClear} className="px-3 py-1.5 text-[10px] font-heading font-bold rounded bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive hover:text-white transition-all">
              CLEAR RESPONSE
            </button>
          </div>
          <AnalysisOutput content={srtSummary} title="SRT Analysis" />
        </div>
      )}

      <div className="gold-stripe" />

      {/* Handwritten Upload */}
      <div className="glass-card-subtle">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-gold shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-heading font-semibold text-sm text-foreground mb-1">Upload Handwritten SRT Sheets</p>
            <p className="text-xs text-muted-foreground font-body leading-relaxed">
              Upload images of your handwritten SRT. <strong className="text-foreground">Two-column format: Situation | Reaction</strong> works best.
            </p>
          </div>
        </div>
        <div className="mt-3">
          <button onClick={() => document.getElementById('srt-images')?.click()} disabled={extracting}
            className="glass-button-accent text-xs">
            <ImageIcon className="h-4 w-4 inline mr-1.5" />
            {extracting ? 'Extracting...' : 'Upload SRT Images'}
          </button>
          <input id="srt-images" type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => { if (e.target.files?.length) { handleImageUpload(e.target.files); e.target.value = ''; } }} />
        </div>
      </div>

      {extracting && <LoadingCard message="Extracting SRT responses from images..." />}

      <div className="gold-stripe" />
      <p className="font-heading font-semibold text-xs text-gold uppercase tracking-wider">Or Type Directly</p>

      {/* Direct Typing Table */}
      <div className="glass-card space-y-3">
        {rows.map((r, i) => (
          <div key={i} className="glass-card-subtle relative">
            <div className="flex items-center justify-between mb-2">
              <span className="olq-badge border-gold/50 text-gold text-[10px]">#{i + 1}</span>
              {(r.situation.trim() || r.response.trim()) && (
                <button onClick={() => removeRow(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="space-y-2">
              <textarea value={r.situation} onChange={(e) => updateRow(i, 'situation', e.target.value)}
                placeholder="Situation..." rows={2} className="glass-input resize-none text-sm" />
              <textarea value={r.response} onChange={(e) => updateRow(i, 'response', e.target.value)}
                placeholder="Your response..." rows={2} className="glass-input resize-none text-sm" />
            </div>
          </div>
        ))}
        <p className="text-xs text-muted-foreground font-body">{filledRows.length} responses filled</p>
      </div>

      {filledRows.length > 0 && (
        genCount >= 5 ? (
          <div className="glass-card-subtle border-destructive/20 text-center py-3">
            <p className="font-heading text-xs text-destructive mb-2">Generation limit reached (5/5). Please clear to start over.</p>
          </div>
        ) : (
          <button onClick={analyzeAll} disabled={loading}
            className="w-full glass-button-gold py-3.5 disabled:opacity-40 glow-gold">
            {loading ? 'ANALYZING SRT...' : `ANALYZE ALL SRT RESPONSES (${5 - genCount} clicks left)`}
          </button>
        )
      )}

      {loading && <LoadingCard message="Evaluating responses... mapping OLQs..." />}
    </div>
  );
}
