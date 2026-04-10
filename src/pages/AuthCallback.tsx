import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      navigate(session ? '/' : '/login', { replace: true });
    });
  }, [navigate]);
  return (
    <div className="min-h-screen flex items-center justify-center topo-bg">
      <div className="h-10 w-10 border-2 border-gold border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
