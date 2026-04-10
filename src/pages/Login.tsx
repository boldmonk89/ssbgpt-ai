import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { lovable } from '@/integrations/lovable/index';
import { toast } from 'sonner';
import ssbgptLogo from '@/assets/logo-ssbgpt.png';
import { useLanguage } from '@/hooks/useLanguage';

export default function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    if (!loading && user) navigate('/', { replace: true });
  }, [user, loading, navigate]);

  const handleGoogleLogin = async () => {
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(t('loginFailed'));
        return;
      }
      if (result.redirected) return;
    } catch (err: any) {
      toast.error(err.message || t('loginFailed'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center topo-bg">
        <div className="h-10 w-10 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center topo-bg px-4">
      <div className="glass-card w-full max-w-sm text-center space-y-6">
        <div className="flex justify-center">
          <img src={ssbgptLogo} alt="SSBGPT" className="h-20 w-20 object-contain" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold text-foreground">{t('welcomeBack')}</h1>
          <p className="font-body text-sm text-muted-foreground mt-1">{t('signInToContinue')}</p>
        </div>
        <button onClick={handleGoogleLogin} className="glass-button-gold w-full flex items-center justify-center gap-3 text-sm py-3">
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {t('signInWithGoogle')}
        </button>
        <p className="text-[10px] text-muted-foreground/50">{t('bySigningIn')}</p>
      </div>
    </div>
  );
}
