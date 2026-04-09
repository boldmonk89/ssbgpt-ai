import { NavLink, useLocation } from 'react-router-dom';
import { Shield, FileText, MessageSquare, Zap, UserCircle, LayoutDashboard, Menu, X, ClipboardList, BrainCircuit, Swords } from 'lucide-react';
import { useState } from 'react';
import ssbgptLogo from '@/assets/logo-ssbgpt.png';
import { InstallAppButton, useInstallPrompt } from '@/components/InstallAppButton';
import { Download } from 'lucide-react';

const navItems = [
  { to: '/', label: 'Home', icon: LayoutDashboard },
  { to: '/ai-practice', label: 'AI Practice', icon: BrainCircuit },
  { to: '/gto', label: 'GTO Tasks', icon: Swords },
  { to: '/full-analysis', label: 'Full Analysis', icon: ClipboardList },
  { to: '/piq', label: 'PIQ', icon: UserCircle },
  { to: '/tat', label: 'TAT', icon: FileText },
  { to: '/wat', label: 'WAT', icon: MessageSquare },
  { to: '/srt', label: 'SRT', icon: Zap },
  { to: '/sd', label: 'SD', icon: Shield },
];

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
        <Download className="h-3.5 w-3.5" />
        <span className="hidden xs:inline">Install App</span>
      </button>
      {showIOSGuide && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center" onClick={() => setShowIOSGuide(false)}>
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm" />
          {/* Reuse iOS guide from InstallAppButton */}
        </div>
      )}
    </>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row topo-bg">
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
          <span className="font-heading font-bold text-sm tracking-wider text-gold">AI PSYCH ANALYSIS</span>
        </div>
        <InstallHeaderButton />
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
                className={`flex items-center gap-3 px-3 py-2.5 text-sm font-heading font-semibold rounded-xl transition-all duration-300 ${
                  isActive
                    ? 'text-foreground border-l-[3px] border-gold'
                    : 'text-muted-foreground hover:text-foreground'
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
          <span className="font-heading font-bold text-sm tracking-wider text-gold">AI PSYCH ANALYSIS</span>
        </div>
        <div className="p-4 md:p-8 max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
