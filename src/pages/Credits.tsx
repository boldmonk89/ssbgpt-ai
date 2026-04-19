import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { processPayment } from '@/lib/razorpay';
import { Shield, Zap, Sparkles, CreditCard, MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

const PRICING_PLANS = [
  { credits: 50, price: 75, badge: 'Standard' },
  { credits: 75, price: 100, badge: 'Popular', highlighted: true },
  { credits: 200, price: 350, badge: 'Saver' },
  { credits: 500, price: 600, badge: 'Officer Choice' },
];

export default function Credits() {
  const { user, credits, fetchCredits } = useAuthStore();
  const [customAmount, setCustomAmount] = useState<number>(50);

  const handlePurchase = async (planCredits: number, price: number) => {
    if (!user) return toast.error('Please login first');
    
    await processPayment(
      planCredits, 
      price, 
      { 
        id: user.id, 
        email: user.email || '', 
        name: user.user_metadata?.full_name || 'Candidate' 
      },
      () => fetchCredits(user.id)
    );
  };

  // Logic for custom amount: Pro-rated based on average price (~₹1.5 per credit)
  // Ensure minimum 50 credits
  const calculatePrice = (amt: number) => {
    if (amt <= 50) return 75;
    if (amt <= 75) return 100;
    if (amt <= 200) return 350;
    if (amt <= 500) return 600;
    return Math.ceil(amt * 1.2); // ₹1.2 for bulk custom
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Current Balance Card */}
      <div className="relative overflow-hidden group">
        <div className="absolute inset-0 bg-gold/10 backdrop-blur-xl border border-gold/20 rounded-3xl" />
        <div className="relative p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 text-center md:text-left">
            <h2 className="text-sm font-heading font-bold text-gold uppercase tracking-[0.3em] opacity-60">Current Reserve</h2>
            <div className="flex items-center justify-center md:justify-start gap-4">
              <span className="text-6xl md:text-8xl font-heading font-black text-foreground tabular-nums drop-shadow-glow">
                {credits}
              </span>
              <div className="space-y-1">
                <span className="text-xl md:text-2xl font-heading font-bold text-gold/80 block">CREDITS</span>
                <span className="text-[10px] md:text-xs uppercase tracking-widest text-muted-foreground font-bold">Available for Analysis</span>
              </div>
            </div>
          </div>

          <div className="w-full md:w-64 space-y-4">
            <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest mb-1">
              <span className="text-muted-foreground">Session Integrity</span>
              <span className="text-gold">Operational</span>
            </div>
            <Progress value={Math.min((credits / 500) * 100, 100)} className="h-1 bg-gold/10" />
            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-[10px] uppercase font-bold text-muted-foreground opacity-50 mb-1">Status</p>
                <p className="text-xs font-bold text-green-500 uppercase tracking-widest">Active</p>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <p className="text-[10px] uppercase font-bold text-muted-foreground opacity-50 mb-1">Level</p>
                <p className="text-xs font-bold text-gold uppercase tracking-widest">Cadet</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Grid */}
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-heading font-black text-foreground uppercase tracking-tight">Refill Ammo</h3>
          <p className="text-sm text-muted-foreground font-body max-w-md mx-auto">
            Top up your account to access advanced AI evaluations and full PSH testing modules.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRICING_PLANS.map((plan) => (
            <div 
              key={plan.credits}
              className={`relative flex flex-col p-6 rounded-3xl border transition-all duration-300 hover:scale-[1.02] ${
                plan.highlighted 
                  ? 'bg-gold/10 border-gold shadow-[0_0_40px_rgba(207,169,78,0.15)] ring-1 ring-gold/50' 
                  : 'bg-card/50 border-border/30 hover:border-gold/30'
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gold text-slate-950 text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg">
                  Most Popular
                </div>
              )}
              
              <div className="flex-1 space-y-6">
                <div>
                  <h4 className="text-sm font-heading font-bold text-muted-foreground uppercase tracking-widest mb-1">{plan.badge}</h4>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-heading font-black text-foreground">{plan.credits}</span>
                    <span className="text-xs font-bold text-gold uppercase">Credits</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border/10">
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-2xl font-bold text-foreground">₹{plan.price}</span>
                    <span className="text-[10px] font-bold text-muted-foreground opacity-50 uppercase tracking-widest">Onetime</span>
                  </div>

                  <Button 
                    onClick={() => handlePurchase(plan.credits, plan.price)}
                    className={`w-full py-6 rounded-2xl font-bold uppercase tracking-widest transition-all ${
                      plan.highlighted 
                        ? 'bg-gold text-slate-950 hover:bg-gold/90 shadow-glow' 
                        : 'bg-white/5 hover:bg-white/10 text-foreground border border-white/10'
                    }`}
                  >
                    Deploy Now
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Support & Custom Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
        {/* Custom Amount */}
        <div className="bg-card/30 border border-border/30 rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-3">
            <Zap className="h-5 w-5 text-gold" />
            <h3 className="font-heading font-black text-lg uppercase tracking-tight">Custom Requirement</h3>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">Number of Credits (Min 50)</label>
              <input 
                type="number" 
                value={customAmount}
                onChange={(e) => setCustomAmount(Math.max(50, parseInt(e.target.value) || 0))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-heading font-bold focus:ring-1 focus:ring-gold outline-none"
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-gold/5 border border-gold/10 rounded-2xl">
              <span className="text-sm font-bold text-muted-foreground">Estimated Amount</span>
              <span className="text-xl font-heading font-black text-gold">₹{calculatePrice(customAmount)}</span>
            </div>
            <Button 
              onClick={() => handlePurchase(customAmount, calculatePrice(customAmount))}
              className="w-full bg-white/5 hover:bg-white/10 text-foreground border border-white/10 rounded-xl font-bold uppercase tracking-widest h-12"
            >
              Initialize Payment
            </Button>
          </div>
        </div>

        {/* Support Section */}
        <div className="bg-primary/10 border border-primary/20 rounded-3xl p-8 space-y-6">
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h3 className="font-heading font-black text-lg uppercase tracking-tight">Technical Support</h3>
          </div>
          <p className="text-sm text-muted-foreground font-body">
            Encountering issues with credit allocation or payments? Contact our tactical support unit on Telegram.
          </p>
          <a 
            href="https://t.me/boldmonk89" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-primary/20 rounded-xl flex items-center justify-center">
                <Send className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-heading font-bold text-foreground">Official Telegram</p>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold font-heading">@boldmonk89</p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </a>
        </div>
      </div>
    </div>
  );
}

import { ArrowRight as ArrowRightIcon } from 'lucide-react';
const ArrowRight = ArrowRightIcon;
