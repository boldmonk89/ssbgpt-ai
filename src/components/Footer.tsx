import { Instagram, Send } from 'lucide-react';
import founderImg from '@/assets/founder.jpg';
import telegramQr from '@/assets/telegram-qr.png';
import ssbgptLogo from '@/assets/logo-ssbgpt.png';

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
              <img src={founderImg} alt="Founder" className="h-full w-full object-cover" />
            </div>
          </div>
          <p className="font-highlight italic text-lg text-foreground mb-2">
            "Trying to help out fellow aspirants"
          </p>
          <p className="font-body text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
            Go and get your recommendation. This platform is built to give every SSB aspirant the edge they deserve — powered by AI, guided by real experience.
          </p>
        </div>

        {/* Contact & Socials */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 mb-8">
          {/* Instagram */}
          <a
            href="https://www.instagram.com/traghavvv/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-5 py-3 rounded-xl transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--gold) / 0.1), hsl(var(--gold) / 0.03))',
              border: '1px solid hsl(var(--gold) / 0.2)',
            }}
          >
            <Instagram className="h-5 w-5 text-gold" />
            <div>
              <p className="font-heading font-bold text-sm text-foreground">@traghavvv</p>
              <p className="font-body text-[10px] text-muted-foreground">Instagram</p>
            </div>
          </a>

          {/* Telegram */}
          <a
            href="https://t.me/scorchiee"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 group"
          >
            <div className="h-28 w-28 rounded-xl overflow-hidden border border-border/30 bg-white p-1 transition-all group-hover:scale-105">
              <img src={telegramQr} alt="Telegram QR - @scorchiee" className="h-full w-full object-contain" />
            </div>
            <div className="flex items-center gap-1.5">
              <Send className="h-3.5 w-3.5 text-gold" />
              <p className="font-body text-xs text-muted-foreground">@scorchiee on Telegram</p>
            </div>
          </a>
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
