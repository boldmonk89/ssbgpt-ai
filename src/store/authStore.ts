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
  linkPhone: (phone: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  credits: 0,
  loading: true,
  initialized: false,

  setUser: (user) => set({ user }),
  setCredits: (credits) => set({ credits }),

  fetchCredits: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('candidate_profiles')
        .select('credits')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // Profile doesn't exist, create it with 50 free credits
          const { data: userData } = await supabase.auth.getUser();
          if (userData.user) {
             const { data: newProfile, error: createError } = await supabase
              .from('candidate_profiles')
              .insert({ 
                user_id: userData.user.id, 
                credits: 50,
                contact_email: userData.user.email || '',
                full_name: userData.user.user_metadata.full_name || 'Guest'
              })
              .select()
              .single();
            
            if (!createError && newProfile) {
              set({ credits: newProfile.credits });
              return;
            }
          }
        }
        return;
      }
      
      if (data) {
        set({ credits: data.credits });
      }
    } catch (err) {
      console.error('Fetch credits error:', err);
    }
  },

  deductCredits: async (amount) => {
    const { user, credits } = get();
    if (!user || credits < amount) return false;

    const newBalance = credits - amount;
    const { error } = await supabase
      .from('candidate_profiles')
      .update({ credits: newBalance })
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deducting credits:', error);
      return false;
    }

    set({ credits: newBalance });
    return true;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, credits: 0 });
  },

  linkPhone: async (phone: string) => {
    const { user } = get();
    if (!user) return false;
    
    const { error } = await supabase
      .from('candidate_profiles')
      .update({ contact_phone: phone })
      .eq('user_id', user.id);
      
    return !error;
  },

  initialize: async () => {
    if (get().initialized) return;

    // Get initial session
    let { data: { session } } = await supabase.auth.getSession();
    
    // If no session, create an anonymous one
    if (!session) {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (!error && data.session) {
        session = data.session;
      }
    }
    
    set({ user: session?.user ?? null, initialized: true });

    if (session?.user) {
      await get().fetchCredits(session.user.id);
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
       const currentUser = session?.user ?? null;
       set({ user: currentUser, loading: false });
       if (currentUser) {
         await get().fetchCredits(currentUser.id);
       } else {
         set({ credits: 0 });
       }
    });

    set({ loading: false });
  }
}));
