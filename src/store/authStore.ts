import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  credits: number;
  loading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setCredits: (credits: number) => void;
  fetchCredits: (userId: string) => Promise<void>;
  deductCredits: (amount: number) => Promise<boolean>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  credits: 999, // Static high credits for UI compatibility if any remains
  loading: false,
  initialized: true,

  setUser: (user) => set({ user }),
  setCredits: (credits) => set({ credits }),

  fetchCredits: async () => {
    set({ credits: 999 });
  },

  deductCredits: async () => {
    return true; // Always succeed
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, credits: 999 });
  },

  initialize: async () => {
    // Basic anonymous initialization if needed for RLS, but mostly static now
    const { data: { session } } = await supabase.auth.getSession();
    set({ user: session?.user ?? null, initialized: true, loading: false });
  }
}));
