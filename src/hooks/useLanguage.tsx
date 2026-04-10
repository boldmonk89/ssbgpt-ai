import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Lang = 'en' | 'hi';

interface LangStore {
  lang: Lang;
  setLang: (l: Lang) => void;
}

export const useLangStore = create<LangStore>()(
  persist(
    (set) => ({
      lang: 'en',
      setLang: (lang) => set({ lang }),
    }),
    { name: 'ssb-lang' }
  )
);

const translations: Record<string, Record<Lang, string>> = {
  // Auth
  welcomeBack: { en: 'Welcome to SSB GPT', hi: 'SSB GPT में आपका स्वागत है' },
  signInToContinue: { en: 'Sign in to save your progress', hi: 'अपनी प्रगति सहेजने के लिए साइन इन करें' },
  signInWithGoogle: { en: 'Sign in with Google', hi: 'Google से साइन इन करें' },
  bySigningIn: { en: 'By signing in, you agree to our terms of service', hi: 'साइन इन करके, आप हमारी सेवा की शर्तों से सहमत हैं' },
  loginFailed: { en: 'Login failed. Please try again.', hi: 'लॉगिन विफल। कृपया पुनः प्रयास करें।' },
  signOut: { en: 'Sign Out', hi: 'साइन आउट' },

  // Nav
  home: { en: 'Home', hi: 'होम' },
  history: { en: 'History', hi: 'इतिहास' },
  aiPractice: { en: 'AI Practice', hi: 'AI अभ्यास' },
  gtoTasks: { en: 'GTO Tasks', hi: 'GTO कार्य' },
  fullAnalysis: { en: 'Full Analysis', hi: 'पूर्ण विश्लेषण' },

  // History
  analysisHistory: { en: 'Analysis History', hi: 'विश्लेषण इतिहास' },
  noHistory: { en: 'No analysis history yet. Run an analysis to see results here.', hi: 'अभी तक कोई विश्लेषण इतिहास नहीं। यहाँ परिणाम देखने के लिए विश्लेषण चलाएँ।' },
  deleteConfirm: { en: 'Delete this analysis?', hi: 'यह विश्लेषण हटाएँ?' },
  share: { en: 'Share', hi: 'शेयर करें' },
  shareWhatsapp: { en: 'Share on WhatsApp', hi: 'WhatsApp पर शेयर करें' },
  copyLink: { en: 'Copy Result', hi: 'परिणाम कॉपी करें' },
  copied: { en: 'Copied to clipboard!', hi: 'क्लिपबोर्ड पर कॉपी किया गया!' },
  delete: { en: 'Delete', hi: 'हटाएँ' },
  viewResult: { en: 'View Result', hi: 'परिणाम देखें' },
  language: { en: 'Language', hi: 'भाषा' },
  loginToSave: { en: 'Sign in to save your analysis history', hi: 'विश्लेषण इतिहास सहेजने के लिए साइन इन करें' },

  // General
  offline: { en: 'No internet connection. AI analysis is unavailable offline.', hi: 'कोई इंटरनेट कनेक्शन नहीं। AI विश्लेषण ऑफ़लाइन अनुपलब्ध है।' },
  saved: { en: 'Result saved to history!', hi: 'परिणाम इतिहास में सहेजा गया!' },
};

export function useLanguage() {
  const { lang, setLang } = useLangStore();

  const t = (key: string): string => {
    return translations[key]?.[lang] || translations[key]?.en || key;
  };

  return { lang, setLang, t };
}
