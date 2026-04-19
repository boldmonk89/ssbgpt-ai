import { useState, useCallback } from 'react';
import { useAppStore } from '@/store/appStore';
import { callGemini, buildPiqPrompt, fileToBase64, buildVerifyDocumentPrompt, callGeminiMultiPart } from '@/lib/gemini';
import { LoadingCard } from '@/components/LoadingCard';
import { Upload, User, CheckCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import PurchaseCreditsModal from '@/components/PurchaseCreditsModal';

export default function PIQPage() {
  const { piqContext, setPiqContext, piqImageUrl, setPiqImageUrl } = useAppStore();
  const [loading, setLoading] = useState(false);
  const [fileData, setFileData] = useState<string | null>(piqImageUrl);
  const [fileType, setFileType] = useState<'image' | 'pdf'>('image');
  const { credits, deductCredits } = useAuthStore();
  const navigate = useNavigate();
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  const handleFileUpload = useCallback(async (file: File) => {
    setLoading(true);
    try {
      // Strict format validation
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        throw new Error('Please upload an image or PDF file only.');
      }

      const base64 = await fileToBase64(file);
      const verifyPrompt = buildVerifyDocumentPrompt('PIQ');
      const verification = await callGeminiMultiPart(verifyPrompt, [{ base64, mimeType: file.type || 'application/pdf' }]);

      if (verification.includes('REJECTED')) {
        toast.error(verification.replace('REJECTED:', '').trim(), { duration: 5000 });
        return;
      }

      setFileData(base64);
      setPiqImageUrl(base64);
      setFileType(file.type === 'application/pdf' ? 'pdf' : 'image');
      toast.success('PIQ Verified & Anchored', { icon: "🛡️" });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  }, [setPiqImageUrl]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      handleFileUpload(file);
    }
  }, [handleFileUpload]);

  const analyze = async () => {
    if (!fileData) { toast.error('Please upload your PIQ first.'); return; }
    
    if (credits < 10) {
      toast.error('Insufficient Credits. Please top up.');
      setIsPurchaseModalOpen(true);
      return;
    }

    setLoading(true);
    try {
      const result = await callGemini(buildPiqPrompt(), fileData);
      
      const success = await deductCredits(10);
      if (!success) throw new Error('Credit deduction failed');

      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        setPiqContext(JSON.parse(jsonMatch[0]));
      } else {
        setPiqContext({ rawAnalysis: result });
      }
      toast.success('PIQ analysis complete (-10 Credits)');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setPiqContext(null);
    setFileData(null);
    setPiqImageUrl(null);
    if (document.getElementById('piq-upload')) {
      (document.getElementById('piq-upload') as HTMLInputElement).value = '';
    }
  };

  return (
    <div className="space-y-6 scroll-reveal">
      <div className="gold-border-left">
        <h1 className="text-2xl">PIQ — Personal Information Questionnaire</h1>
        <p className="text-muted-foreground font-body text-sm mt-1">
          Upload your PIQ (PDF or photograph) for AI psychological profiling.
        </p>
      </div>
      <div className="gold-stripe" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()}
          className="glass-card flex flex-col items-center justify-center min-h-[300px] border-2 border-dashed border-border/40 hover:border-gold/40 transition-all duration-300 cursor-pointer"
          onClick={() => { if (!piqContext) document.getElementById('piq-upload')?.click(); }}>
          {fileData ? (
            <div className="relative w-full">
              {fileType === 'pdf' ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <FileText className="h-16 w-16 text-gold" />
                  <p className="font-heading font-semibold text-sm text-foreground">PIQ PDF Uploaded</p>
                  {!piqContext && <p className="text-xs text-muted-foreground font-body">Click to change</p>}
                </div>
              ) : (
                <img 
                  src={fileData} 
                  alt="PIQ" 
                  className="max-h-[400px] mx-auto object-contain rounded-xl" 
                  onError={() => {
                    toast.error("Corrupted image data detected. Please re-upload.");
                    handleClear();
                  }}
                />
              )}
              <div className="absolute top-2 right-2"><CheckCircle className="h-5 w-5 text-success" /></div>
            </div>
          ) : (
            <div className="text-center">
              <p className="font-heading font-semibold text-muted-foreground">Drop your PIQ here</p>
              <p className="text-xs text-muted-foreground/50 font-body mt-1">PDF (2 pages) or photograph</p>
            </div>
          )}
          <input id="piq-upload" type="file" accept="image/*,application/pdf" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) { handleFileUpload(f); e.target.value = ''; } }} />
        </div>

        <div>
          {loading ? (
            <LoadingCard message="Analyzing PIQ... extracting personality indicators..." />
          ) : piqContext ? (
            <div className="glass-card space-y-4 relative">
              <h3 className="text-base font-heading font-bold text-gold gold-border-left pr-24">Psychological Profile</h3>
              <div className="gold-stripe" />
              {piqContext.overallProfile && (
                <p className="font-body text-sm leading-relaxed text-foreground/85">{piqContext.overallProfile}</p>
              )}
              {piqContext.traits && Array.isArray(piqContext.traits) && (
                <div>
                  <p className="font-heading font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2">Personality Traits</p>
                  <div className="flex flex-wrap gap-2">
                    {piqContext.traits.map((t: string, i: number) => (
                      <span key={i} className="olq-badge border-accent/50 text-accent">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {piqContext.keyThemes && Array.isArray(piqContext.keyThemes) && (
                <div>
                  <p className="font-heading font-semibold text-xs text-muted-foreground uppercase tracking-wider mb-2">Key Themes</p>
                  <div className="flex flex-wrap gap-2">
                    {piqContext.keyThemes.map((t: string, i: number) => (
                      <span key={i} className="olq-badge border-gold/50 text-gold">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {piqContext.olqInitialMapping && typeof piqContext.olqInitialMapping === 'object' && (
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <p className="font-heading font-semibold text-xs text-success uppercase tracking-wider mb-2">Likely Strong OLQs</p>
                    {((piqContext.olqInitialMapping as Record<string, unknown>).likelyStrong as string[])?.map((o: string, i: number) => (
                      <p key={i} className="text-sm font-body text-success/80">• {o}</p>
                    ))}
                  </div>
                  <div>
                    <p className="font-heading font-semibold text-xs text-destructive uppercase tracking-wider mb-2">Likely Weak OLQs</p>
                    {((piqContext.olqInitialMapping as Record<string, unknown>).likelyWeak as string[])?.map((o: string, i: number) => (
                      <p key={i} className="text-sm font-body text-destructive/80">• {o}</p>
                    ))}
                  </div>
                </div>
              )}
              {piqContext.rawAnalysis && (
                <p className="font-body text-sm leading-relaxed text-foreground/85 whitespace-pre-wrap">{piqContext.rawAnalysis}</p>
              )}
            </div>
          ) : (
            <div className="glass-card flex flex-col items-center justify-center min-h-[300px] text-muted-foreground">
              <User className="h-12 w-12 mb-4 opacity-30" />
              <p className="font-heading text-sm">Upload and analyze to see your profile</p>
            </div>
          )}
        </div>
      </div>

      {piqContext && !loading ? (
        <div className="glass-card-subtle border-gold/20 text-center py-3">
          <p className="font-heading text-xs text-gold">✓ Analysis Already Done</p>
        </div>
      ) : (
        <button onClick={analyze} disabled={!fileData || loading}
          className="w-full glass-button-gold py-3.5 disabled:opacity-40 glow-gold mt-6">
          {loading ? 'ANALYZING...' : 'ANALYZE PIQ'}
        </button>
      )}

      <PurchaseCreditsModal 
        isOpen={isPurchaseModalOpen} 
        onClose={() => setIsPurchaseModalOpen(false)} 
      />
    </div>
  );
}
