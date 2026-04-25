import { useState } from 'react';
import { callGeminiMultiPart, fileToBase64 } from '@/lib/gemini';
import { callGeminiMultiPart, fileToBase64, buildPpdtPrompt } from '@/lib/gemini';
import { LoadingCard } from '@/components/LoadingCard';
import { AnalysisOutput } from '@/components/AnalysisOutput';
import { useHistorySave } from '@/hooks/useHistorySave';
import { ImageIcon, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PPDTPage() {
  const [loading, setLoading] = useState(false);
  const [picturePreview, setPicturePreview] = useState<string | null>(null);
  const [pictureBase64, setPictureBase64] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const { saveToHistory } = useHistorySave();

  const handleClear = () => {
    setPicturePreview(null);
    setPictureBase64(null);
    setAnalysis(null);
    if (document.getElementById('ppdt-pic')) (document.getElementById('ppdt-pic') as HTMLInputElement).value = '';
  };

  const handlePictureUpload = async (file: File) => {
    const base64 = await fileToBase64(file);
    setPicturePreview(base64);
    setPictureBase64(base64);
    toast.success('PPDT picture uploaded');
  };

  const analyzePicture = async () => {
    if (!pictureBase64) {
      toast.error('Please upload a PPDT picture first');
      return;
    }

    setLoading(true);
    try {
      const mimeType = pictureBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
      const result = await callGeminiMultiPart(
        buildPpdtPrompt('', true),
        [{ base64: pictureBase64, mimeType }]
      );

      const cleanResult = result.replace(/\*/g, '');
      setAnalysis(cleanResult);
      saveToHistory('PPDT', { type: 'picture-analysis' }, cleanResult);
      toast.success('PPDT analysis complete');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 scroll-reveal">
      <div className="gold-border-left flex items-center justify-between">
        <div>
          <h1 className="text-2xl">PPDT — Picture Perception & Description Test</h1>
          <p className="text-muted-foreground font-body text-sm mt-1">
            Upload a hazy PPDT picture to get AI-generated stories, perception analysis, and narration scripts.
          </p>
        </div>
        {(analysis || picturePreview) && (
          <button onClick={handleClear} className="glass-button text-xs flex items-center gap-2 text-destructive hover:bg-destructive/10 border-destructive/20 transition-all duration-300">
            <Trash2 className="h-3.5 w-3.5" />
            Clear All
          </button>
        )}
      </div>

      <div className="gold-stripe" />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* Picture Upload */}
          <div className="glass-card">
            <label className="block text-sm font-heading font-semibold text-gold mb-2">PPDT Picture</label>
            {picturePreview ? (
              <div className="relative">
                <img src={picturePreview} alt="PPDT Picture" className="max-h-[200px] w-full object-contain bg-muted/20 rounded-xl" />
                <button onClick={() => document.getElementById('ppdt-pic')?.click()}
                  className="absolute top-2 right-2 glass-button-gold text-[10px] px-2.5 py-1">Change</button>
              </div>
            ) : (
              <div onClick={() => document.getElementById('ppdt-pic')?.click()}
                className="border border-dashed border-border/50 hover:border-gold/40 p-8 flex flex-col items-center gap-2 cursor-pointer transition-all duration-300 rounded-xl hover:bg-muted/10">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                <p className="text-xs text-muted-foreground font-body">Upload the PPDT picture (usually hazy/blurry)</p>
              </div>
            )}
            <input id="ppdt-pic" type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) { handlePictureUpload(f); e.target.value = ''; } }} />
          </div>

          {analysis && !loading ? (
            <div className="glass-card-subtle border-gold/20 text-center py-4 px-6 relative overflow-hidden flex flex-col gap-4">
              <div className="absolute inset-0 bg-gold/5 blur-xl"></div>
              <div>
                <p className="font-heading font-semibold text-sm text-gold mb-1 relative z-10">Analysis Complete</p>
                <p className="font-body text-xs text-muted-foreground relative z-10 leading-relaxed max-w-md mx-auto">
                  PPDT analysis is ready. To practice a new picture, discard your current response below.
                </p>
              </div>
              <div className="flex gap-3 justify-center relative z-10 mt-2">
                <button onClick={handleClear} className="glass-button text-xs px-4 py-2 hover:border-destructive hover:text-destructive flex items-center gap-2">
                  Delete & Upload New Image
                </button>
              </div>
            </div>
          ) : (
            <button onClick={analyzePicture} disabled={!pictureBase64 || loading}
              className="w-full glass-button-gold py-3.5 disabled:opacity-40 glow-gold">
              {loading ? 'ANALYZING PICTURE...' : 'ANALYZE PPDT PICTURE'}
            </button>
          )}
        </div>

        <div>
          {loading ? (
            <LoadingCard message="Analyzing PPDT picture... perceiving characters... generating stories..." />
          ) : analysis ? (
            <AnalysisOutput content={analysis} title="PPDT Analysis & Stories" />
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
