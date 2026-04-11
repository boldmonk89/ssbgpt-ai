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

      <div className="glass-card p-8 flex flex-col items-center gap-6">
        <div className="h-6 w-48 pulse-loading rounded-full" />
        <div className="h-64 w-64 rounded-full border-4 border-muted/20 pulse-loading" />
        <div className="grid grid-cols-3 gap-4 w-full">
           {[1,2,3].map(i => <div key={i} className="h-12 pulse-loading rounded-xl" />)}
        </div>
      </div>
    </div>
  );
}
