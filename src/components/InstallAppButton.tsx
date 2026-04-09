import { useState, useEffect } from 'react';
import { Download, Share, X, Plus } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Detect iOS
    const ua = navigator.userAgent;
    const isiOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOS(isiOS);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  return { canInstall: !!deferredPrompt && !isInstalled, isInstalled, isIOS, install };
}

export function InstallAppButton() {
  const { canInstall, isInstalled, isIOS, install } = useInstallPrompt();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;

  // Show iOS guide popup
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-2 px-3 py-2 text-xs font-heading font-semibold rounded-xl text-gold transition-all duration-300 hover:text-foreground w-full"
          style={{
            background: 'linear-gradient(135deg, hsl(var(--gold) / 0.15) 0%, hsl(var(--gold) / 0.05) 100%)',
            border: '1px solid hsl(var(--gold) / 0.3)',
          }}
        >
          <Download className="h-4 w-4" />
          Install App
        </button>

        {showIOSGuide && <IOSInstallGuide onClose={() => setShowIOSGuide(false)} />}
      </>
    );
  }

  // Android / Chrome
  if (!canInstall) return null;

  return (
    <button
      onClick={install}
      className="flex items-center gap-2 px-3 py-2 text-xs font-heading font-semibold rounded-xl text-gold transition-all duration-300 hover:text-foreground w-full"
      style={{
        background: 'linear-gradient(135deg, hsl(var(--gold) / 0.15) 0%, hsl(var(--gold) / 0.05) 100%)',
        border: '1px solid hsl(var(--gold) / 0.3)',
      }}
    >
      <Download className="h-4 w-4" />
      Install App
    </button>
  );
}

function IOSInstallGuide({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
      <div 
        className="relative w-full max-w-sm mx-4 mb-8 rounded-2xl p-5 animate-in slide-in-from-bottom-8 duration-300"
        style={{
          background: 'linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--card) / 0.95) 100%)',
          border: '1px solid hsl(var(--gold) / 0.3)',
          boxShadow: '0 -8px 40px hsl(var(--background) / 0.8)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-5 w-5" />
        </button>

        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl mb-3" style={{
            background: 'linear-gradient(135deg, hsl(var(--gold) / 0.2) 0%, hsl(var(--gold) / 0.05) 100%)',
            border: '1px solid hsl(var(--gold) / 0.3)',
          }}>
            <Download className="h-6 w-6 text-gold" />
          </div>
          <h3 className="font-heading font-bold text-base text-foreground">Install SSB GPT</h3>
          <p className="text-xs text-muted-foreground mt-1">Add to your home screen for quick access</p>
        </div>

        <div className="space-y-4">
          {/* Step 1 */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold text-gold" style={{
              background: 'hsl(var(--gold) / 0.15)',
              border: '1px solid hsl(var(--gold) / 0.2)',
            }}>1</div>
            <div>
              <p className="text-sm font-heading font-semibold text-foreground flex items-center gap-1.5">
                Tap the <Share className="h-4 w-4 text-gold inline" /> Share button
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Bottom bar me Share icon pe tap karo</p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold text-gold" style={{
              background: 'hsl(var(--gold) / 0.15)',
              border: '1px solid hsl(var(--gold) / 0.2)',
            }}>2</div>
            <div>
              <p className="text-sm font-heading font-semibold text-foreground flex items-center gap-1.5">
                Scroll down & tap <Plus className="h-4 w-4 text-gold inline" /> Add to Home Screen
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Share menu me neeche scroll karo</p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold text-gold" style={{
              background: 'hsl(var(--gold) / 0.15)',
              border: '1px solid hsl(var(--gold) / 0.2)',
            }}>3</div>
            <div>
              <p className="text-sm font-heading font-semibold text-foreground">Tap "Add" to confirm</p>
              <p className="text-xs text-muted-foreground mt-0.5">Ab SSB GPT aapke home screen pe hoga!</p>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-4" style={{ borderTop: '1px solid hsl(var(--border) / 0.3)' }}>
          <p className="text-[10px] text-center text-muted-foreground/60">Works offline · No app store needed</p>
        </div>
      </div>
    </div>
  );
}
