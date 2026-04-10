import { useLanguage } from '@/hooks/useLanguage';

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <button
      onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
      className="flex items-center gap-1.5 px-3 py-2 text-[10px] font-heading font-semibold rounded-xl text-gold transition-all active:scale-95"
      style={{
        background: 'linear-gradient(135deg, hsl(var(--gold) / 0.15) 0%, hsl(var(--gold) / 0.05) 100%)',
        border: '1px solid hsl(var(--gold) / 0.3)',
      }}
    >
      {lang === 'en' ? 'हिंदी' : 'EN'}
    </button>
  );
}
