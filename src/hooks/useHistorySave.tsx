import { toast } from 'sonner';

export function useHistorySave() {
  const saveToHistory = async (testType: string, inputData: any, result: string) => {
    try {
      const existing = localStorage.getItem('ssbgpt_local_history');
      const history = existing ? JSON.parse(existing) : [];
      
      const newRecord = {
        id: Date.now().toString(),
        test_type: testType,
        input_data: inputData,
        result,
        created_at: new Date().toISOString(),
      };
      
      history.unshift(newRecord);
      
      // Keep only last 50 local records to prevent filling up storage too much
      const trimmedHistory = history.slice(0, 50);
      
      localStorage.setItem('ssbgpt_local_history', JSON.stringify(trimmedHistory));
      toast.success('Result saved locally!');
    } catch (e) {
      console.error('Failed to save to history', e);
    }
  };

  return { saveToHistory, canSave: true };
}
