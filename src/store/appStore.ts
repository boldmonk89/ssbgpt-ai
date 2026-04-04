import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  analysis?: any;
}

export interface SrtResponse {
  situationNumber: number;
  situation: string;
  response: string;
  analysis?: any;
}

export interface SdParagraph {
  type: string;
  content: string;
  analysis?: string;
}

interface AppState {
  piqContext: any | null;
  setPiqContext: (ctx: any) => void;
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

  tatSummary: string;
  setTatSummary: (s: string) => void;
  watSummary: string;
  setWatSummary: (s: string) => void;
  srtSummary: string;
  setSrtSummary: (s: string) => void;
  sdSummary: string;
  setSdSummary: (s: string) => void;
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
  piqContext: null,
  piqImageUrl: null,
  tatStories: [{ storyNumber: 1, story: '' }] as TatStory[],
  watResponses: [] as WatResponse[],
  srtResponses: [] as SrtResponse[],
  sdParagraphs: SD_TYPES.map(t => ({ type: t, content: '', analysis: '' })),
  tatSummary: '',
  watSummary: '',
  srtSummary: '',
  sdSummary: '',
  fullReport: '',
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,
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
      setWatSummary: (s) => set({ watSummary: s }),
      setSrtSummary: (s) => set({ srtSummary: s }),
      setSdSummary: (s) => set({ sdSummary: s }),
      setFullReport: (r) => set({ fullReport: r }),
      clearSession: () => {
        set(() => ({ ...initialState }));
      },
    }),
    { name: 'ssb-psych-analyzer' }
  )
);
