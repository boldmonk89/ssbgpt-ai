import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Derive a per-user storage key so different users on same browser never share data
function getUserStorageKey(): string {
  try {
    // Supabase stores the session synchronously in localStorage
    const raw = localStorage.getItem('sb-' + new URL(import.meta.env.VITE_SUPABASE_URL ?? 'https://placeholder.supabase.co').hostname.split('.')[0] + '-auth-token');
    if (raw) {
      const parsed = JSON.parse(raw);
      const userId = parsed?.user?.id || parsed?.user?.phone || parsed?.user?.email;
      if (userId) return `ssb-psych-${userId}`;
    }
  } catch { /* fallback */ }
  // Fallback: check supabase session synchronously stored data
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.includes('-auth-token')) {
        const raw = localStorage.getItem(k);
        if (raw) {
          const parsed = JSON.parse(raw);
          const userId = parsed?.user?.id || parsed?.user?.phone || parsed?.user?.email;
          if (userId) return `ssb-psych-${userId}`;
        }
      }
    }
  } catch { /* fallback */ }
  return 'ssb-psych-analyzer';
}

const STORE_KEY = getUserStorageKey();

export interface OlqScores {
  effectiveIntelligence: number;
  reasoningAbility: number;
  organizingAbility: number;
  powerOfExpression: number;
  socialAdaptability: number;
  cooperation: number;
  senseOfResponsibility: number;
  initiative: number;
  selfConfidence: number;
  speedOfDecision: number;
  abilityToInfluence: number;
  liveliness: number;
  determination: number;
  courage: number;
  stamina: number;
}

export const OLQ_NAMES: Record<keyof OlqScores, string> = {
  effectiveIntelligence: 'Effective Intelligence',
  reasoningAbility: 'Reasoning Ability',
  organizingAbility: 'Organizing Ability',
  powerOfExpression: 'Power of Expression',
  socialAdaptability: 'Social Adaptability',
  cooperation: 'Cooperation',
  senseOfResponsibility: 'Sense of Responsibility',
  initiative: 'Initiative',
  selfConfidence: 'Self Confidence',
  speedOfDecision: 'Speed of Decision',
  abilityToInfluence: 'Ability to Influence',
  liveliness: 'Liveliness',
  determination: 'Determination',
  courage: 'Courage',
  stamina: 'Stamina',
};

export const OLQ_FACTORS: Record<string, { label: string; color: string; keys: (keyof OlqScores)[] }> = {
  I: { label: 'Factor I — Mind', color: '#2e6db4', keys: ['effectiveIntelligence', 'reasoningAbility', 'organizingAbility', 'powerOfExpression'] },
  II: { label: 'Factor II — Heart', color: '#1e7d4f', keys: ['socialAdaptability', 'cooperation', 'senseOfResponsibility'] },
  III: { label: 'Factor III — Guts', color: '#c9a84c', keys: ['initiative', 'selfConfidence', 'speedOfDecision', 'abilityToInfluence', 'liveliness'] },
  IV: { label: 'Factor IV — Limbs', color: '#c0392b', keys: ['determination', 'courage', 'stamina'] },
};

export interface TatStory {
  storyNumber: number;
  story: string;
  pictureDescription?: string;
  analysis?: string;
}

export interface WatResponse {
  word: string;
  sentence: string;
  analysis?: string | Record<string, unknown>;
}

export interface SrtResponse {
  situationNumber: number;
  situation: string;
  response: string;
  analysis?: string | Record<string, unknown>;
}

export interface SdParagraph {
  type: string;
  content: string;
  analysis?: string;
}

export interface ExamStats {
  tatAttempted: number;
  watAttempted: number;
  srtAttempted: number;
  sdAttempted: number;
}

interface AppState {
  userPhone: string;
  setUserPhone: (val: string) => void;

  examStats: ExamStats;
  setExamStats: (stats: Partial<ExamStats>) => void;

  piqContext: string | Record<string, unknown> | null;
  setPiqContext: (ctx: string | Record<string, unknown> | null) => void;
  piqImageUrl: string | null;
  setPiqImageUrl: (url: string | null) => void;

  tatStories: TatStory[];
  setTatStories: (stories: TatStory[]) => void;
  updateTatStory: (index: number, story: Partial<TatStory>) => void;

  watResponses: WatResponse[];
  setWatResponses: (responses: WatResponse[]) => void;

  srtResponses: SrtResponse[];
  setSrtResponses: (responses: SrtResponse[]) => void;

  sdParagraphs: SdParagraph[];
  setSdParagraphs: (paragraphs: SdParagraph[]) => void;
  updateSdParagraph: (index: number, para: Partial<SdParagraph>) => void;

  tatSummary: string | null;
  setTatSummary: (s: string | null) => void;
  watSummary: string | null;
  setWatSummary: (s: string | null) => void;
  srtSummary: string | null;
  setSrtSummary: (s: string | null) => void;
  sdSummary: string | null;
  setSdSummary: (s: string | null) => void;
  tatFile: string | null;
  setTatFile: (file: string | null) => void;
  watFile: string | null;
  setWatFile: (file: string | null) => void;
  srtFile: string | null;
  setSrtFile: (file: string | null) => void;
  sdFile: string | null;
  setSdFile: (file: string | null) => void;

  fullReport: string;
  setFullReport: (r: string) => void;

  clearSession: () => void;
}

const SD_TYPES = [
  'What your Parents think of you',
  'What your Teachers think of you',
  'What your Friends think of you',
  'What YOU think of yourself',
  'Qualities you wish to develop',
];

const initialState = {
  userPhone: '',
  examStats: {
    tatAttempted: 0,
    watAttempted: 0,
    srtAttempted: 0,
    sdAttempted: 0
  },
  piqContext: null,
  piqImageUrl: null,
  tatStories: [{ storyNumber: 1, story: '' }] as TatStory[],
  watResponses: [] as WatResponse[],
  srtResponses: [] as SrtResponse[],
  sdParagraphs: SD_TYPES.map(t => ({ type: t, content: '', analysis: '' })),
  tatSummary: null,
  tatFile: null,
  watSummary: null,
  watFile: null,
  srtSummary: null,
  srtFile: null,
  sdSummary: null,
  sdFile: null,
  fullReport: '',
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,
      setUserPhone: (val) => set({ userPhone: val }),
      setExamStats: (stats) => set((s) => ({ examStats: { ...s.examStats, ...stats } })),
      setPiqContext: (ctx) => set({ piqContext: ctx }),
      setPiqImageUrl: (url) => set({ piqImageUrl: url }),
      setTatStories: (stories) => set({ tatStories: stories }),
      updateTatStory: (index, story) =>
        set((s) => ({
          tatStories: s.tatStories.map((t, i) => (i === index ? { ...t, ...story } : t)),
        })),
      setWatResponses: (responses) => set({ watResponses: responses }),
      setSrtResponses: (responses) => set({ srtResponses: responses }),
      setSdParagraphs: (paragraphs) => set({ sdParagraphs: paragraphs }),
      updateSdParagraph: (index, para) =>
        set((s) => ({
          sdParagraphs: s.sdParagraphs.map((p, i) => (i === index ? { ...p, ...para } : p)),
        })),
      setTatSummary: (s) => set({ tatSummary: s }),
      setTatFile: (file) => set({ tatFile: file }),
      setWatSummary: (s) => set({ watSummary: s }),
      setWatFile: (file) => set({ watFile: file }),
      setSrtSummary: (s) => set({ srtSummary: s }),
      setSrtFile: (file) => set({ srtFile: file }),
      setSdSummary: (s) => set({ sdSummary: s }),
      setSdFile: (file) => set({ sdFile: file }),
      setFullReport: (r) => set({ fullReport: r }),
      clearSession: () => {
        set(() => ({ ...initialState }));
      },
    }),
    {
      name: STORE_KEY,
      storage: {
        getItem: (name) => {
          const str = sessionStorage.getItem(name);
          return str ? JSON.parse(str) : null;
        },
        setItem: (name, value) => {
          try {
            sessionStorage.setItem(name, JSON.stringify(value));
          } catch (e) {
            console.error('Storage quota exceeded', e);
          }
        },
        removeItem: (name) => sessionStorage.removeItem(name),
      }
    }
  )
);
