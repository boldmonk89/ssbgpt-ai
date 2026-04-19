import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { Shield, Lock, ArrowRight, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function Login() {
  const { user, loading } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || 'Error signing in with Google');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[url('/assets/splash.png')] bg-cover bg-center relative">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-card/50 backdrop-blur-2xl border border-gold/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Animated background glow */}
          <div className="absolute -top-24 -right-24 h-48 w-48 bg-gold/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-24 -left-24 h-48 w-48 bg-primary/10 rounded-full blur-3xl animate-pulse delay-700" />

          <div className="flex flex-col items-center text-center space-y-6">
            <div className="h-20 w-20 bg-gold/10 border border-gold/30 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(207,169,78,0.2)]">
              <Shield className="h-10 w-10 text-gold" />
            </div>

            <div className="space-y-2">
              <h1 className="text-3xl font-heading font-black tracking-tighter text-foreground uppercase">
                Officer Access
              </h1>
              <p className="text-muted-foreground text-sm font-body uppercase tracking-[0.2em] font-medium opacity-60">
                Secure Authentication Required
              </p>
            </div>

            <div className="w-full space-y-4 pt-4">
              <Button 
                onClick={handleGoogleLogin}
                className="w-full h-14 bg-white hover:bg-slate-50 text-slate-900 border-none rounded-xl font-bold flex items-center justify-center gap-3 transition-all active:scale-95 group"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="h-5 w-5" />
                <span>Continue with Google</span>
              </Button>

              <div className="flex items-center gap-4 py-2">
                <div className="h-px flex-1 bg-border/50" />
                <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/50">Military Intelligence Node</span>
                <div className="h-px flex-1 bg-border/50" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gold/5 border border-gold/10 flex flex-col items-center gap-2">
                  <Lock className="h-4 w-4 text-gold/60" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-gold/60">Encrypted</span>
                </div>
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex flex-col items-center gap-2">
                  <Shield className="h-4 w-4 text-primary/60" />
                  <span className="text-[10px] uppercase font-bold tracking-widest text-primary/60">Verified</span>
                </div>
              </div>
            </div>

            <p className="text-[10px] font-body text-muted-foreground/40 leading-relaxed max-w-[280px] pt-4">
              By accessing this terminal, you agree to the Tactical Engagement Protocols and Data Protection Standards.
            </p>
          </div>
        </div>
        
        {/* Footer info */}
        <div className="mt-8 flex items-center justify-center gap-6 opacity-30">
          <span className="text-[8px] uppercase tracking-[0.4em] font-black text-gold">Unit 2025</span>
          <div className="h-1 w-1 rounded-full bg-gold/50" />
          <span className="text-[8px] uppercase tracking-[0.4em] font-black text-gold">SSB GPT CORE</span>
        </div>
      </div>
    </div>
  );
}
