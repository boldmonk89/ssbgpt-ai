import ssbgptLogo from '@/assets/logo-ssbgpt.png';

export default function ClinicalSeal({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="relative group">
         {/* Animated Glow Rings */}
         <div className="absolute inset-0 bg-gold/20 rounded-full blur-xl animate-pulse" />
         <div className="absolute -inset-2 border border-gold/10 rounded-full animate-ping-slow" />
         
         <div className="relative h-16 w-16 rounded-full border-2 border-gold/40 bg-black flex items-center justify-center shadow-[0_0_20px_rgba(207,169,78,0.2)] overflow-hidden">
            <img src={ssbgptLogo} alt="SSBGPT Logo" className="h-10 w-10 object-contain drop-shadow-[0_0_8px_rgba(207,169,78,0.8)]" />
         </div>
      </div>
      
      <div className="text-center">
         <p className="text-[10px] font-black text-gold uppercase tracking-[0.4em]">Accuracy Verified</p>
         <p className="text-[8px] text-muted-foreground/60 uppercase tracking-[0.2em] mt-1">
            SSBGPT Standardized Analysis — Mansa-Vacha-Karma Verification Matrix
         </p>
      </div>
    </div>
  );
}
