import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { callGemini, callGeminiMultiPart, buildTatPrompt, buildTatPdfPrompt, buildExtractTextFromImagePrompt, fileToBase64 } from '@/lib/gemini';
import { validateStory } from '@/lib/validation';
import { detectGibberish } from '@/lib/gibberishDetector';
import { LoadingCard } from '@/components/LoadingCard';
import { AnalysisOutput } from '@/components/AnalysisOutput';
import { useHistorySave } from '@/hooks/useHistorySave';
import { Upload, ImageIcon, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import PurchaseCreditsModal from '@/components/PurchaseCreditsModal';

export default function TATPage() {
  const { tatStories, updateTatStory, tatSummary, setTatSummary } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [extractingStory, setExtractingStory] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [picturePreview, setPicturePreview] = useState<string | null>(null);
  const [pictureBase64, setPictureBase64] = useState<string | null>(null);
  const { saveToHistory } = useHistorySave();
  const { credits, deductCredits } = useAuthStore();
  const navigate = useNavigate();
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  const story = tatStories[0];

  const handleClear = () => {
    updateTatStory(0, { story: '', analysis: null });
    setPicturePreview(null);
    setPictureBase64(null);
    setTatSummary(null);
    if (document.getElementById('tat-pic')) (document.getElementById('tat-pic') as HTMLInputElement).value = '';
    if (document.getElementById('tat-pdf')) (document.getElementById('tat-pdf') as HTMLInputElement).value = '';
    if (document.getElementById('tat-story-img')) (document.getElementById('tat-story-img') as HTMLInputElement).value = '';
  };

  const handlePictureUpload = async (file: File) => {
    const base64 = await fileToBase64(file);
    setPicturePreview(base64);
    setPictureBase64(base64);
    toast.success('TAT picture uploaded');
  };

  const handleStoryImageUpload = async (file: File) => {
    setExtractingStory(true);
    try {
      const base64 = await fileToBase64(file);
      const extractedText = await callGemini(buildExtractTextFromImagePrompt('TAT story written by an SSB candidate'), base64);
      updateTatStory(0, { story: extractedText });
      toast.success('Story text extracted from image');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to extract text');
    } finally {
      setExtractingStory(false);
    }
  };

  const analyzeStory = async () => {
    // Client-side gibberish check
    const gibberishMsg = detectGibberish(story.story);
    if (gibberishMsg) {
      updateTatStory(0, { analysis: gibberishMsg });
      return;
    }
    const v = validateStory(story.story);
    if (!v.valid) { toast.error(v.message!); return; }
    if (credits < 10) {
      toast.error('Insufficient Credits. Please top up.');
      setIsPurchaseModalOpen(true);
      return;
    }

    setLoading(true);
    try {
      const prompt = buildTatPrompt(story.storyNumber, story.story, !!pictureBase64);
      let result: string;
      if (pictureBase64) {
        const mimeType = pictureBase64.startsWith('data:image/png') ? 'image/png' : 'image/jpeg';
        result = await callGeminiMultiPart(prompt, [{ base64: pictureBase64, mimeType }]);
      } else {
        result = await callGemini(prompt);
      }

      const success = await deductCredits(10);
      if (!success) throw new Error('Credit deduction failed');

      updateTatStory(0, { analysis: result.replace(/\*/g, '') });
      saveToHistory('TAT', { storyNumber: story.storyNumber, story: story.story }, result);
      toast.success('Story analyzed (-10 Credits)');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const handlePdfUpload = async (file: File) => {
    if (credits < 10) {
      toast.error('Insufficient Credits. Please top up.');
      setIsPurchaseModalOpen(true);
      return;
    }

    setPdfLoading(true);
    try {
      const base64 = await fileToBase64(file);
      const result = await callGeminiMultiPart(buildTatPdfPrompt(), [{ base64, mimeType: 'application/pdf' }]);
      
      const success = await deductCredits(10);
      if (!success) throw new Error('Credit deduction failed');

      setTatSummary(result);
      saveToHistory('TAT-PDF', { fileName: file.name }, result);
      toast.success('Full TAT PDF analyzed (-10 Credits)');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'PDF analysis failed');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="space-y-6 scroll-reveal">
      <div className="gold-border-left">
        <h1 className="text-2xl">TAT — Thematic Apperception Test</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">
          Analyze a single TAT story or upload your full TAT PDF for complete review.
        </p>
      </div>

      <div className="gold-stripe" />

      {/* PDF Upload */}
      <div className="glass-card">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="font-heading font-semibold text-sm text-foreground">Full TAT Review (PDF)</p>
            <p className="text-xs text-muted-foreground font-body mt-0.5">Upload complete TAT with all stories for batch analysis.</p>
          </div>
          <button onClick={() => document.getElementById('tat-pdf')?.click()} disabled={pdfLoading}
            className="glass-button-accent text-xs">
            {pdfLoading ? 'Analyzing...' : 'Upload TAT PDF'}
          </button>
          <input id="tat-pdf" type="file" accept="application/pdf,image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) { handlePdfUpload(f); e.target.value = ''; } }} />
        </div>
      </div>

      {pdfLoading && <LoadingCard message="Analyzing full TAT PDF..." />}
      {tatSummary && !pdfLoading && <AnalysisOutput content={tatSummary} title="Full TAT Analysis" />}

      <div className="gold-stripe" />
      <p className="font-heading font-semibold text-xs text-gold uppercase tracking-wider">Or Analyze Single Story</p>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-4">
          {/* Picture Upload */}
          <div className="glass-card">
            <label className="block text-sm font-heading font-semibold text-gold mb-2">TAT Picture</label>
            {picturePreview ? (
              <div className="relative">
                <img src={picturePreview} alt="TAT Picture" className="max-h-[200px] w-full object-contain bg-muted/20 rounded-xl" />
                <button onClick={() => document.getElementById('tat-pic')?.click()}
                  className="absolute top-2 right-2 glass-button-gold text-[10px] px-2.5 py-1">Change</button>
              </div>
            ) : (
              <div onClick={() => document.getElementById('tat-pic')?.click()}
                className="border border-dashed border-border/50 hover:border-gold/40 p-8 flex flex-col items-center gap-2 cursor-pointer transition-all duration-300 rounded-xl hover:bg-muted/10">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                <p className="text-xs text-muted-foreground font-body">Upload the TAT picture</p>
              </div>
            )}
            <input id="tat-pic" type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) { handlePictureUpload(f); e.target.value = ''; } }} />
          </div>

          {/* Story Input */}
          <div className="glass-card">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-heading font-semibold text-gold">Your Story</label>
              <button onClick={() => document.getElementById('tat-story-img')?.click()}
                disabled={extractingStory}
                className="flex items-center gap-1.5 text-xs font-heading text-muted-foreground hover:text-gold transition-colors disabled:opacity-40">
                {extractingStory ? 'Extracting...' : 'Upload handwritten'}
              </button>
              <input id="tat-story-img" type="file" accept="image/*" className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) { handleStoryImageUpload(f); e.target.value = ''; } }} />
            </div>
            <textarea
              value={story.story}
              onChange={(e) => updateTatStory(0, { story: e.target.value })}
              placeholder="Write your TAT story here or upload a handwritten image..."
              rows={10}
              className="glass-input resize-y leading-relaxed"
            />
          </div>

          {story.analysis && !loading ? (
            <div className="glass-card-subtle border-gold/20 text-center py-4 px-6 relative overflow-hidden flex flex-col gap-4">
              <div className="absolute inset-0 bg-gold/5 blur-xl"></div>
              <div>
                <p className="font-heading font-semibold text-sm text-gold mb-1 relative z-10">Analysis Complete (1/1)</p>
                <p className="font-body text-xs text-muted-foreground relative z-10 leading-relaxed max-w-md mx-auto">
                  The core of TAT is evaluating your first, instinctive thought. To practice a new story and re-enable generation, properly discard your current response below.
                </p>
              </div>
              <div className="flex gap-3 justify-center relative z-10 mt-2">
                <button onClick={() => updateTatStory(0, { story: '', picture: undefined, analysis: '' })} className="glass-button text-xs px-4 py-2 hover:border-destructive hover:text-destructive flex items-center gap-2">
                   Delete & Upload New Image
                </button>
              </div>
            </div>
          ) : (
            <button onClick={analyzeStory} disabled={!story.story.trim() || loading}
              className="w-full glass-button-gold py-3.5 disabled:opacity-40 glow-gold">
              {loading ? 'ANALYZING STORY...' : 'ANALYZE STORY'}
            </button>
          )}
        </div>

        <div>
          {loading ? (
            <LoadingCard message="Analyzing story structure... mapping OLQs..." />
          ) : story.analysis ? (
            <AnalysisOutput content={story.analysis} title="Story Analysis" />
          ) : (
            <div className="glass-card flex items-center justify-center min-h-[200px] text-muted-foreground font-heading text-sm">
              Analysis will appear here
            </div>
          )}
        </div>
      </div>

      <PurchaseCreditsModal 
        isOpen={isPurchaseModalOpen} 
        onClose={() => setIsPurchaseModalOpen(false)} 
      />
    </div>
  );
}
