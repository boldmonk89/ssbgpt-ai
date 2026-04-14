import { NavLink, useLocation } from 'react-router-dom';
import { Shield, FileText, MessageSquare, Zap, UserCircle, LayoutDashboard, Menu, X, BrainCircuit, Swords, History, Trash2, GitCompare, Users, FlaskConical } from 'lucide-react';
import { useState } from 'react';
import ssbgptLogo from '@/assets/logo-ssbgpt.png';
import { InstallAppButton, useInstallPrompt } from '@/components/InstallAppButton';
import { Download } from 'lucide-react';
import OfflineBanner from '@/components/OfflineBanner';
import PageTransition from '@/components/PageTransition';
import { useAppStore } from '@/store/appStore';
import { toast } from 'sonner';

import { useEffect } from 'react';
import splashImg from '@/assets/splash.png';

const navItems = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/piq', label: 'PIQ', icon: UserCircle },
  { to: '/tat', label: 'TAT', icon: FileText },
  { to: '/wat', label: 'WAT', icon: MessageSquare },
  { to: '/srt', label: 'SRT', icon: Zap },
  { to: '/sd', label: 'SD', icon: Shield },
  { to: '/gto', label: 'GTO Tasks', icon: Swords },
  { to: '/interview', label: 'Interview Practice', icon: Users },
  { to: '/ai-practice', label: 'AI Practice Sandbox', icon: BrainCircuit },
  { to: '/full-analysis', label: 'Full Psych Test', icon: Shield },
  { to: '/practice-lab', label: 'SSB Practice Lab', icon: FlaskConical },
  { to: '/history', label: 'History', icon: History },
];

function SplashScreen() {
  const [show, setShow] = useState(true);
  const [fade, setFade] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Fill progress bar over 3.5s
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 1, 100));
    }, 35); // Approx 3.5s finish

    const fadeTimer = setTimeout(() => setFade(true), 3500);
    const removeTimer = setTimeout(() => setShow(false), 4500);
    
    return () => { 
      clearInterval(progressInterval);
      clearTimeout(fadeTimer); 
      clearTimeout(removeTimer); 
    };
  }, []);

  if (!show) return null;

  return (
    <div className={`fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-background transition-opacity duration-1000 ${fade ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <img src={splashImg} alt="Your Future" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px]" />
      <div className="relative z-10 flex flex-col items-center text-center animate-in slide-in-from-bottom-5 fade-in duration-1000">
        <h1 className="text-4xl md:text-7xl font-heading font-black text-gold tracking-[0.25em] drop-shadow-2xl">THIS IS YOU</h1>
        <h2 className="text-2xl md:text-4xl font-heading font-medium text-white tracking-[0.3em] drop-shadow-2xl mt-4 uppercase opacity-90">Earn the Camouflage</h2>
        
        <div className="mt-12 w-64 h-1 bg-white/10 rounded-full overflow-hidden relative">
          <div 
            className="absolute inset-y-0 left-0 bg-gold transition-all duration-300 ease-out shadow-[0_0_15px_rgba(207,169,78,0.5)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-4 text-[10px] uppercase tracking-[0.4em] text-white/40 font-bold">
           Initializing Practice Environment... {progress}%
        </p>
      </div>
    </div>
  );
}

function InstallHeaderButton() {
  const { canInstall, isInstalled, isIOS, install } = useInstallPrompt();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) return null;
  if (!canInstall && !isIOS) return null;

  return (
    <>
      <button
        onClick={isIOS ? () => setShowIOSGuide(true) : install}
        className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-heading font-semibold rounded-xl text-gold transition-all active:scale-95"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--gold) / 0.15) 0%, hsl(var(--gold) / 0.05) 100%)',
          border: '1px solid hsl(var(--gold) / 0.3)',
        }}
      >
        <span className="hidden xs:inline">Install App</span>
      </button>
      {showIOSGuide && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center" onClick={() => setShowIOSGuide(false)}>
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
        </div>
      )}
    </>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const clearSession = useAppStore((s) => s.clearSession);

  return (
    <div className="min-h-screen flex flex-col topo-bg">
      <SplashScreen />
      <OfflineBanner />
      <div className="flex flex-col lg:flex-row flex-1">
      {/* Mobile Header */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-border/30" style={{
        background: 'linear-gradient(180deg, hsl(var(--card) / 0.8) 0%, hsl(var(--card) / 0.5) 100%)',
        backdropFilter: 'blur(24px) saturate(1.8)',
      }}>
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="h-10 w-10 flex items-center justify-center rounded-xl text-gold hover:text-foreground transition-all active:scale-90" style={{
            background: 'linear-gradient(135deg, hsl(var(--gold) / 0.15) 0%, hsl(var(--gold) / 0.05) 100%)',
            border: '1px solid hsl(var(--gold) / 0.3)',
          }}>
            {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
          <span className="font-heading font-black text-sm tracking-[0.2em] text-gold uppercase">SSB GPT</span>
        </div>
        <div className="flex items-center gap-2">
          <InstallHeaderButton />
        </div>
      </header>

      {/* Sidebar */}
      <aside className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-40
        w-[260px] flex-shrink-0
        flex flex-col transition-transform duration-300
        border-r border-border/30
      `} style={{
        background: 'linear-gradient(180deg, hsl(var(--sidebar-background) / 0.9) 0%, hsl(var(--sidebar-background) / 0.7) 100%)',
        backdropFilter: 'blur(32px) saturate(2)',
        boxShadow: '4px 0 24px hsl(var(--background) / 0.5)',
      }}>
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-gold/60 glow-gold flex-shrink-0">
              <img src={ssbgptLogo} alt="SSBGPT" width={40} height={40} className="h-full w-full object-cover" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-sm tracking-wider text-foreground">AI PSYCH</h1>
              <p className="font-heading text-[10px] text-gold tracking-[0.2em]">ANALYSIS</p>
            </div>
          </div>
        </div>

        <div className="gold-stripe mx-4" />

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-heading font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] ${
                  isActive
                    ? 'text-foreground border-l-[3px] border-gold glow-gold shadow-lg bg-gold/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-gold/5'
                }`}
                style={isActive ? {
                  background: 'linear-gradient(90deg, hsl(var(--gold) / 0.1) 0%, transparent 100%)',
                  backdropFilter: 'blur(8px)',
                } : {}}>
                <item.icon className={`h-4 w-4 transition-colors ${isActive ? 'text-gold' : ''}`} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="gold-stripe mx-4" />

        <div className="p-4 space-y-3">
          <InstallAppButton />
          <p className="text-[10px] font-body text-muted-foreground/40 px-3">15 OLQ Analysis Framework</p>
          <button
            onClick={() => { clearSession(); toast.success('Session cleared'); }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-heading font-semibold rounded-xl text-destructive/70 hover:text-destructive transition-all"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--destructive) / 0.08) 0%, transparent 100%)',
              border: '1px solid hsl(var(--destructive) / 0.2)',
            }}
          >
            Clear Session
          </button>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-background/60 z-30 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      <main className="flex-1 min-h-screen">
        <div className="hidden lg:flex items-center justify-between px-8 py-3 border-b border-border/20" style={{
          background: 'linear-gradient(180deg, hsl(var(--card) / 0.4) 0%, transparent 100%)',
          backdropFilter: 'blur(16px)',
        }}>
          <span className="font-heading font-black text-sm tracking-[0.2em] text-gold uppercase">AI PSYCH ANALYSIS</span>
          <div className="flex items-center gap-3">
            <InstallHeaderButton />
          </div>
        </div>
        <div className="p-4 md:p-8 pt-6 md:pt-10 max-w-6xl mx-auto">
          <PageTransition>
            {children}
          </PageTransition>
        </div>
      </main>
      </div>
    </div>
  );
}
