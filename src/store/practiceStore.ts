import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface PracticeState {
  // AI Practice Sandbox
  aiActiveTab: string;
  setAiActiveTab: (tab: string) => void;
  
  tatImage: string | null;
  tatImageName: string;
  tatResult: string;
  setTatData: (data: { image?: string | null; name?: string; result?: string }) => void;
  
  watWord: string;
  watResult: string;
  setWatData: (data: { word?: string; result?: string }) => void;
  
  srtSituation: string;
  srtResult: string;
  setSrtData: (data: { situation?: string; result?: string }) => void;
  
  ppdtImage: string | null;
  ppdtImageName: string;
  ppdtResult: string;
  setPpdtData: (data: { image?: string | null; name?: string; result?: string }) => void;

  // GTO Practice
  gtoActiveTab: string;
  setGtoActiveTab: (tab: string) => void;
  
  gdTopic: string;
  gdResult: string;
  setGdData: (data: { topic?: string; result?: string }) => void;
  
  gpeScenario: string;
  gpeResult: string;
  gpeUserSolution: string;
  gpeUserAnalysis: string;
  gpePdfFile: string | null;
  gpePdfName: string;
  setGpeData: (data: { scenario?: string; result?: string; userSolution?: string; userAnalysis?: string; pdfFile?: string | null; pdfName?: string }) => void;
  
  lecTopic: string;
  lecResult: string;
  lecUserText: string;
  lecUserAnalysis: string;
  setLecData: (data: { topic?: string; result?: string; userText?: string; userAnalysis?: string }) => void;

  clearPracticeSession: () => void;
}

const initialState = {
  aiActiveTab: 'tat',
  tatImage: null,
  tatImageName: '',
  tatResult: '',
  watWord: '',
  watResult: '',
  srtSituation: '',
  srtResult: '',
  ppdtImage: null,
  ppdtImageName: '',
  ppdtResult: '',
  
  gtoActiveTab: 'gd',
  gdTopic: '',
  gdResult: '',
  gpeScenario: '',
  gpeResult: '',
  gpeUserSolution: '',
  gpeUserAnalysis: '',
  gpePdfFile: null,
  gpePdfName: '',
  lecTopic: '',
  lecResult: '',
  lecUserText: '',
  lecUserAnalysis: '',
};

export const usePracticeStore = create<PracticeState>()(
  persist(
    (set) => ({
      ...initialState,
      setAiActiveTab: (tab) => set({ aiActiveTab: tab }),
      setTatData: (data) => set((s) => ({ ...s, ...data })),
      setWatData: (data) => set((s) => ({ ...s, ...data })),
      setSrtData: (data) => set((s) => ({ ...s, ...data })),
      setPpdtData: (data) => set((s) => ({ ...s, ...data })),
      
      setGtoActiveTab: (tab) => set({ gtoActiveTab: tab }),
      setGdData: (data) => set((s) => ({ ...s, ...data })),
      setGpeData: (data) => set((s) => ({ ...s, ...data })),
      setLecData: (data) => set((s) => ({ ...s, ...data })),
      
      clearPracticeSession: () => set(initialState),
    }),
    {
      name: 'ssbgpt-practice-session',
      storage: createJSONStorage(() => sessionStorage), // Essential: Clears on browser close
    }
  )
);
