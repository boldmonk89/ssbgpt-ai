import { Card } from "@/components/ui/card";

export function SkeletonAnalysis() {
  return (
    <div className="space-y-6 w-full animate-in fade-in duration-700">
      <div className="glass-card p-6 space-y-4">
        <div className="h-8 w-1/3 pulse-loading rounded-lg" />
        <div className="space-y-2">
          <div className="h-4 w-full pulse-loading rounded" />
          <div className="h-4 w-full pulse-loading rounded" />
          <div className="h-4 w-2/3 pulse-loading rounded" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="glass-card p-6 space-y-4">
            <div className="h-6 w-1/4 pulse-loading rounded-lg" />
            <div className="space-y-2">
              <div className="h-3 w-full pulse-loading rounded" />
              <div className="h-3 w-5/6 pulse-loading rounded" />
              <div className="h-3 w-4/6 pulse-loading rounded" />
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card p-10 flex flex-col items-center gap-8 relative overflow-hidden">
        {/* Pulse Ring */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="h-64 w-64 rounded-full border border-gold/20 animate-ping-slow" />
          <div className="absolute h-48 w-48 rounded-full border border-gold/10 animate-ping-slower" />
        </div>

        <div className="h-6 w-64 pulse-loading rounded-full" />
        <div className="relative group">
           <div className="absolute inset-0 bg-gold/5 blur-3xl rounded-full group-hover:bg-gold/10 transition-colors" />
           <div className="h-72 w-72 rounded-full border-4 border-gold/10 pulse-loading relative z-10 flex flex-col items-center justify-center text-center">
              <div className="h-2 w-2 bg-gold rounded-full animate-pulse shadow-[0_0_15px_rgba(207,169,78,0.8)]" />
              <p className="mt-4 text-[9px] font-black text-gold/40 uppercase tracking-[0.4em]">Active Synthesis</p>
           </div>
        </div>
        <div className="grid grid-cols-3 gap-6 w-full max-w-lg">
           {[1,2,3].map(i => <div key={i} className="h-16 pulse-loading rounded-xl border border-white/5" />)}
        </div>
      </div>
    </div>
  );
}
