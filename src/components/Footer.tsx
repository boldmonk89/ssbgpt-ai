import { Instagram, Send } from 'lucide-react';
import founderImg from '@/assets/founder.jpg';
import ssbgptLogo from '@/assets/logo-ssbgpt.png';
import { Button } from '@/components/ui/button';
import ClinicalSeal from '@/components/ClinicalSeal';

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-border/20" style={{
      background: 'linear-gradient(180deg, transparent 0%, hsl(var(--card) / 0.3) 30%, hsl(var(--card) / 0.6) 100%)',
    }}>
      {/* About the Founder */}
      <div className="max-w-4xl mx-auto px-6 pt-10 pb-8">
        <div className="text-center mb-8">
          <p className="font-body text-xs tracking-[0.15em] uppercase text-gold mb-4">About the Founder</p>
          <div className="flex justify-center mb-4">
            <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-gold/50 glow-gold">
              <img src={founderImg} alt="Founder" className="h-full w-full object-cover object-top" />
            </div>
          </div>
          <p className="font-highlight italic text-lg text-foreground mb-2">
            "Trying to help out fellow aspirants"
          </p>
          <p className="font-body text-[13px] text-muted-foreground max-w-lg mx-auto leading-relaxed mt-4 italic">
            "Everything here was built for the one who first inspired my defense journey. Though they are no longer with me, I carry their legacy forward. My mission will truly be accomplished only when I finally earn my commission."
          </p>
        </div>

        {/* Contact & Socials — Premium Buttons */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-12">
          {/* Instagram Button */}
          <Button 
            asChild
            variant="outline"
            size="lg"
            className="w-full md:w-64 h-16 rounded-2xl border-gold/30 hover:border-gold hover:bg-gold/5 transition-all group overflow-hidden relative"
          >
            <a
              href="https://www.instagram.com/traghavvv/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3"
            >
              <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Instagram className="h-5 w-5 text-gold relative z-10" />
              <div className="text-left relative z-10">
                <p className="font-heading font-black text-xs text-foreground uppercase tracking-widest leading-none">@traghavvv</p>
                <p className="font-body text-[8px] text-muted-foreground uppercase tracking-widest mt-1">Visit Instagram</p>
              </div>
            </a>
          </Button>

          {/* Telegram Button */}
          <Button 
            asChild
            variant="outline"
            size="lg"
            className="w-full md:w-64 h-16 rounded-2xl border-gold/30 hover:border-gold hover:bg-gold/5 transition-all group overflow-hidden relative"
          >
            <a
              href="https://t.me/scorchiee"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3"
            >
              <div className="absolute inset-0 bg-gold/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <Send className="h-5 w-5 text-gold relative z-10" />
              <div className="text-left relative z-10">
                <p className="font-heading font-black text-xs text-foreground uppercase tracking-widest leading-none">@scorchiee</p>
                <p className="font-body text-[8px] text-muted-foreground uppercase tracking-widest mt-1">Connect on Telegram</p>
              </div>
            </a>
          </Button>
        </div>

        {/* Clinical Integrity Seal */}
        <div className="flex justify-center mb-16 border-y border-white/5 py-10 bg-white/[0.02]">
           <ClinicalSeal />
        </div>

        {/* Bottom Bar */}
        <div className="gold-stripe mb-4" />
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src={ssbgptLogo} alt="SSBGPT" className="h-6 w-6 rounded-full" />
            <span className="font-heading font-bold text-xs text-foreground tracking-wider">SSB GPT Pvt. Ltd.</span>
          </div>
          <p className="font-body text-[10px] text-muted-foreground/50">
            © {new Date().getFullYear()} SSB GPT Pvt. Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
