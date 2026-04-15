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
      setTatData: (data) => set((s) => ({
        tatImage: data.image !== undefined ? data.image : s.tatImage,
        tatImageName: data.name !== undefined ? data.name : s.tatImageName,
        tatResult: data.result !== undefined ? data.result : s.tatResult,
      })),
      setWatData: (data) => set((s) => ({
        watWord: data.word !== undefined ? data.word : s.watWord,
        watResult: data.result !== undefined ? data.result : s.watResult,
      })),
      setSrtData: (data) => set((s) => ({
        srtSituation: data.situation !== undefined ? data.situation : s.srtSituation,
        srtResult: data.result !== undefined ? data.result : s.srtResult,
      })),
      setPpdtData: (data) => set((s) => ({
        ppdtImage: data.image !== undefined ? data.image : s.ppdtImage,
        ppdtImageName: data.name !== undefined ? data.name : s.ppdtImageName,
        ppdtResult: data.result !== undefined ? data.result : s.ppdtResult,
      })),
      
      setGtoActiveTab: (tab) => set({ gtoActiveTab: tab }),
      setGdData: (data) => set((s) => ({
        gdTopic: data.topic !== undefined ? data.topic : s.gdTopic,
        gdResult: data.result !== undefined ? data.result : s.gdResult,
      })),
      setGpeData: (data) => set((s) => ({
        gpeScenario: data.scenario !== undefined ? data.scenario : s.gpeScenario,
        gpeResult: data.result !== undefined ? data.result : s.gpeResult,
        gpeUserSolution: data.userSolution !== undefined ? data.userSolution : s.gpeUserSolution,
        gpeUserAnalysis: data.userAnalysis !== undefined ? data.userAnalysis : s.gpeUserAnalysis,
        gpePdfFile: data.pdfFile !== undefined ? data.pdfFile : s.gpePdfFile,
        gpePdfName: data.pdfName !== undefined ? data.pdfName : s.gpePdfName,
      })),
      setLecData: (data) => set((s) => ({
        lecTopic: data.topic !== undefined ? data.topic : s.lecTopic,
        lecResult: data.result !== undefined ? data.result : s.lecResult,
        lecUserText: data.userText !== undefined ? data.userText : s.lecUserText,
        lecUserAnalysis: data.userAnalysis !== undefined ? data.userAnalysis : s.lecUserAnalysis,
      })),
      
      clearPracticeSession: () => set(initialState),
    }),
    {
      name: 'ssbgpt-practice-session',
      storage: createJSONStorage(() => sessionStorage), // Essential: Clears on browser close
    }
  )
);
