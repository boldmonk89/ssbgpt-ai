import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from 'sonner';

export function useHistorySave() {
  const { user } = useAuth();
  const { t, lang } = useLanguage();

  const saveToHistory = async (testType: string, inputData: any, result: string) => {
    if (!user) return;
    try {
      await supabase.from('analysis_history').insert({
        user_id: user.id,
        test_type: testType,
        input_data: inputData,
        result,
        language: lang,
      });
      toast.success(t('saved'));
    } catch {}
  };

  return { saveToHistory, canSave: !!user };
}
