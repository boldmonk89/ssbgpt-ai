import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { lovable } from '@/integrations/lovable/index';
import { toast } from 'sonner';
import ssbgptLogo from '@/assets/logo-ssbgpt.png';
import { useLanguage } from '@/hooks/useLanguage';

import slide1 from '@/assets/slideshow/slide1.jpg';
import slide2 from '@/assets/slideshow/slide2.jpg';
import slide3 from '@/assets/slideshow/slide3.jpg';
import slide4 from '@/assets/slideshow/slide4.jpg';
import slide5 from '@/assets/slideshow/slide5.jpg';
import slide6 from '@/assets/slideshow/slide6.jpg';

const SLIDES = [slide1, slide2, slide3, slide4, slide5, slide6];

export default function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!loading && user) navigate('/', { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const handleGoogleLogin = async () => {
    try {
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: `${window.location.origin}/auth/callback`,
      });
      if (result.error) {
        toast.error(t('loginFailed'));
        return;
      }
      if (result.redirected) return;
    } catch (error) {
      const err = error as Error;
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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Slideshow Background */}
      {SLIDES.map((src, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-[2000ms] ease-in-out"
          style={{
            opacity: currentSlide === i ? 1 : 0,
            backgroundImage: `url(${src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      ))}
      {/* Dark gradient overlay matching the Dashboard */}
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(180deg, hsl(var(--background) / 0.55) 0%, hsl(var(--background) / 0.70) 50%, hsl(var(--background) / 0.90) 100%)',
      }} />

      <div className="relative z-10 w-full max-w-sm px-4">
        {/* Main headline text before login box */}
        <div className="text-center mb-8">
          <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground leading-tight drop-shadow-md">
            Master Your<br />
            <span className="font-highlight italic text-gold">Psychology.</span>
          </h1>
          <p className="font-body text-sm text-foreground/90 mt-3 drop-shadow">
            AI-powered assessment for TAT, WAT, SRT & PIQ.
          </p>
        </div>

        <div className="glass-card text-center space-y-6" style={{
          background: 'linear-gradient(180deg, hsl(var(--card) / 0.8) 0%, hsl(var(--card) / 0.4) 100%)',
          backdropFilter: 'blur(24px) saturate(1.8)',
        }}>
          <div className="flex justify-center">
            <img src={ssbgptLogo} alt="SSBGPT" className="h-20 w-20 object-contain drop-shadow-lg" />
          </div>
          <div>
            <h2 className="font-heading text-xl font-bold text-foreground">{t('welcomeBack')}</h2>
            <p className="font-body text-sm text-muted-foreground mt-1">{t('signInToContinue')}</p>
          </div>
          <button onClick={handleGoogleLogin} className="glass-button-gold w-full flex items-center justify-center gap-3 text-sm py-3 transition-transform active:scale-95">
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
    </div>
  );
}
