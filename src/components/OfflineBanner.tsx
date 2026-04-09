import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/use-online-status';

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="sticky top-0 z-[100] flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-heading font-semibold"
      style={{
        background: 'linear-gradient(90deg, hsl(0 70% 40%) 0%, hsl(30 80% 40%) 100%)',
        color: 'white',
      }}
    >
      <WifiOff className="h-4 w-4" />
      No internet connection. AI analysis is unavailable offline.
    </div>
  );
}
