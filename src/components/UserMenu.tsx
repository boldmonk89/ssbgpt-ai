import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { useNavigate } from 'react-router-dom';
import { LogOut, User, History } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function UserMenu() {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user) {
    return (
      <button
        onClick={() => navigate('/login')}
        className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-heading font-semibold rounded-xl text-gold transition-all active:scale-95"
        style={{
          background: 'linear-gradient(135deg, hsl(var(--gold) / 0.15) 0%, hsl(var(--gold) / 0.05) 100%)',
          border: '1px solid hsl(var(--gold) / 0.3)',
        }}
      >
        <User className="h-3.5 w-3.5" />
        <span className="hidden xs:inline">Sign In</span>
      </button>
    );
  }

  const avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const name = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0];

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="h-8 w-8 rounded-full overflow-hidden border-2 border-gold/40 hover:border-gold/70 transition-colors">
        {avatar ? (
          <img src={avatar} alt={name} className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-xs font-bold text-gold" style={{ background: 'hsl(var(--muted))' }}>
            {name?.charAt(0)?.toUpperCase()}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl overflow-hidden z-50" style={{
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border) / 0.6)',
          boxShadow: '0 8px 32px hsl(var(--background) / 0.8)',
        }}>
          <div className="px-3 py-2 border-b border-border/30">
            <p className="text-xs font-body font-semibold text-foreground truncate">{name}</p>
            <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
          </div>
          <button onClick={() => { setOpen(false); navigate('/history'); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-body text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors">
            <History className="h-3.5 w-3.5" />
            {t('history')}
          </button>
          <button onClick={() => { setOpen(false); signOut(); }} className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-body text-destructive hover:bg-destructive/10 transition-colors">
            <LogOut className="h-3.5 w-3.5" />
            {t('signOut')}
          </button>
        </div>
      )}
    </div>
  );
}
