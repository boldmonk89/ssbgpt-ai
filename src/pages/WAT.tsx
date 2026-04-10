import { useState } from 'react';
import { useAppStore, WatResponse } from '@/store/appStore';
import { callGemini, callGeminiMultiPart, buildWatPrompt, buildWatPdfPrompt, buildExtractWatFromImagePrompt, fileToBase64 } from '@/lib/gemini';
import { detectGibberish } from '@/lib/gibberishDetector';
import { LoadingCard } from '@/components/LoadingCard';
import { AnalysisOutput } from '@/components/AnalysisOutput';
import { useHistorySave } from '@/hooks/useHistorySave';
import { Trash2, ImageIcon, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function WATPage() {
  const { watResponses, setWatResponses, watSummary, setWatSummary } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const { saveToHistory } = useHistorySave();

  const rows = watResponses.length > 0 ? watResponses : [{ word: '', sentence: '' }];

  const updateRow = (i: number, field: 'word' | 'sentence', value: string) => {
    const updated = [...rows];
    updated[i] = { ...updated[i], [field]: value };
    if (i === updated.length - 1 && (updated[i].word.trim() || updated[i].sentence.trim())) {
      updated.push({ word: '', sentence: '' });
    }
    setWatResponses(updated);
  };

  const removeRow = (i: number) => {
    const updated = rows.filter((_, idx) => idx !== i);
    setWatResponses(updated.length > 0 ? updated : [{ word: '', sentence: '' }]);
  };

  const handleImageUpload = async (files: FileList) => {
    setExtracting(true);
    try {
      let allParsed: WatResponse[] = [];
      for (const file of Array.from(files)) {
        const base64 = await fileToBase64(file);
        const result = await callGemini(buildExtractWatFromImagePrompt(), base64);
        const jsonMatch = result.match(/\[[\s\S]*\]/);
        if (jsonMatch) allParsed = [...allParsed, ...JSON.parse(jsonMatch[0])];
      }
      if (allParsed.length > 0) {
        const existing = rows.filter(r => r.word.trim() || r.sentence.trim());
        setWatResponses([...existing, ...allParsed, { word: '', sentence: '' }]);
        toast.success(`Extracted ${allParsed.length} WAT responses`);
      } else {
        toast.error('Could not extract WAT responses. Try clearer images.');
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
      const result = await callGeminiMultiPart(buildWatPdfPrompt(), [{ base64, mimeType: file.type === 'application/pdf' ? 'application/pdf' : 'image/jpeg' }]);
      setWatSummary(result);
      saveToHistory('WAT-PDF', { fileName: file.name }, result);
      toast.success('Full WAT analyzed');
    } catch (err: any) {
      toast.error(err.message || 'Analysis failed');
    } finally {
      setPdfLoading(false);
    }
  };

  const filledRows = rows.filter(r => r.word.trim() && r.sentence.trim());

  const analyzeAll = async () => {
    if (filledRows.length === 0) { toast.error('Type some WAT responses first.'); return; }
    // Check for gibberish in sentences
    const allSentences = filledRows.map(r => r.sentence).join(' ');
    const gibberishMsg = detectGibberish(allSentences);
    if (gibberishMsg) {
      setWatSummary(gibberishMsg);
      return;
    }
    setLoading(true);
    try {
      const result = await callGemini(buildWatPrompt(filledRows));
      setWatSummary(result);
      saveToHistory('WAT', { responses: filledRows }, result);
      toast.success('WAT analysis complete');
    } catch (err: any) {
      toast.error(err.message || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 scroll-reveal">
      <div className="gold-border-left">
        <h1 className="text-2xl">WAT — Word Association Test</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">
          Type your responses below, upload handwritten sheets, or upload full WAT PDF.
        </p>
      </div>
      <div className="gold-stripe" />

      {/* Full PDF/Image Upload */}
      <div className="glass-card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-heading font-semibold text-sm text-foreground">Full WAT Review (PDF / Image)</p>
            <p className="text-xs text-muted-foreground font-body mt-0.5">Upload complete WAT for batch analysis.</p>
          </div>
          <button onClick={() => document.getElementById('wat-pdf')?.click()} disabled={pdfLoading}
            className="glass-button-accent text-xs">
            <FileText className="h-4 w-4 inline mr-1.5" />
            {pdfLoading ? 'Analyzing...' : 'Upload WAT PDF'}
          </button>
          <input id="wat-pdf" type="file" accept="application/pdf,image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) { handlePdfUpload(f); e.target.value = ''; } }} />
        </div>
      </div>

      {pdfLoading && <LoadingCard message="Analyzing full WAT..." />}
      {watSummary && !pdfLoading && !loading && <AnalysisOutput content={watSummary} title="WAT Analysis" />}

      <div className="gold-stripe" />

      {/* Handwritten Upload */}
      <div className="glass-card-subtle">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-gold shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-heading font-semibold text-sm text-foreground mb-1">Upload Handwritten WAT Sheets</p>
            <p className="text-xs text-muted-foreground font-body leading-relaxed">
              Upload images of your handwritten WAT. <strong className="text-foreground">Two-column format: Word | Sentence</strong> works best for accurate extraction.
            </p>
          </div>
        </div>
        <div className="mt-3">
          <button onClick={() => document.getElementById('wat-images')?.click()} disabled={extracting}
            className="glass-button-accent text-xs">
            <ImageIcon className="h-4 w-4 inline mr-1.5" />
            {extracting ? 'Extracting...' : 'Upload WAT Images'}
          </button>
          <input id="wat-images" type="file" accept="image/*" multiple className="hidden"
            onChange={(e) => { if (e.target.files?.length) { handleImageUpload(e.target.files); e.target.value = ''; } }} />
        </div>
      </div>

      {extracting && <LoadingCard message="Extracting WAT responses from images..." />}

      <div className="gold-stripe" />
      <p className="font-heading font-semibold text-xs text-gold uppercase tracking-wider">Or Type Directly</p>

      {/* Direct Typing Table */}
      <div className="glass-card overflow-x-auto">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="border-b border-border/50 text-left">
              <th className="py-2.5 px-3 font-heading font-semibold text-gold text-xs w-8">#</th>
              <th className="py-2.5 px-3 font-heading font-semibold text-gold text-xs w-[140px]">Word</th>
              <th className="py-2.5 px-3 font-heading font-semibold text-gold text-xs">Sentence</th>
              <th className="py-2.5 px-3 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-border/20">
                <td className="py-2 px-3 text-muted-foreground">{i + 1}</td>
                <td className="py-2 px-3">
                  <input type="text" value={r.word} onChange={(e) => updateRow(i, 'word', e.target.value)}
                    placeholder="Word" className="glass-input py-1.5 text-sm" />
                </td>
                <td className="py-2 px-3">
                  <input type="text" value={r.sentence} onChange={(e) => updateRow(i, 'sentence', e.target.value)}
                    placeholder="Your sentence..." className="glass-input py-1.5 text-sm" />
                </td>
                <td className="py-2 px-3">
                  {(r.word.trim() || r.sentence.trim()) && (
                    <button onClick={() => removeRow(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-muted-foreground mt-3 font-body">{filledRows.length} responses filled</p>
      </div>

      {filledRows.length > 0 && (
        watSummary && !loading ? (
          <div className="glass-card-subtle border-gold/20 text-center py-3">
            <p className="font-heading text-xs text-gold mb-2">✓ WAT responses have already been analyzed</p>
            <button onClick={analyzeAll} disabled={loading}
              className="glass-button-accent text-xs py-2">
              Request Fresh Analysis
            </button>
          </div>
        ) : (
          <button onClick={analyzeAll} disabled={loading}
            className="w-full glass-button-gold py-3.5 disabled:opacity-40 glow-gold">
            {loading ? 'ANALYZING WAT...' : 'ANALYZE ALL WAT RESPONSES'}
          </button>
        )
      )}

      {loading && <LoadingCard message="Scanning word associations... mapping OLQs..." />}
    </div>
  );
}
