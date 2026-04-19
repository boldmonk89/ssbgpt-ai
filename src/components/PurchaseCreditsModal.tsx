import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { processPayment } from '@/lib/razorpay';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Shield, Zap, Phone, CreditCard } from 'lucide-react';

const PRICING_PLANS = [
  { credits: 50, price: 75, badge: 'Standard' },
  { credits: 75, price: 100, badge: 'Popular', highlighted: true },
  { credits: 200, price: 350, badge: 'Saver' },
  { credits: 500, price: 600, badge: 'Officer Choice' },
];

interface PurchaseCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PurchaseCreditsModal({ isOpen, onClose, onSuccess }: PurchaseCreditsModalProps) {
  const { user, fetchCredits, linkPhone } = useAuthStore();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [step, setStep] = useState<'PHONE' | 'PLANS'>('PHONE');

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.length < 10) {
      toast.error('Please enter a valid 10-digit phone number');
      return;
    }
    
    setIsLinking(true);
    const success = await linkPhone(phoneNumber);
    setIsLinking(false);
    
    if (success) {
      setStep('PLANS');
      toast.success('Phone linked. Your credits will be reserved to this number.');
    } else {
      toast.error('Failed to link phone number');
    }
  };

  const handlePurchase = async (planCredits: number, price: number) => {
    if (!user) return toast.error('Session not initialized. Please refresh.');
    
    await processPayment(
      planCredits, 
      price, 
      { 
        id: user.id, 
        email: '', // Guest has no email
        name: `Guest-${phoneNumber}` 
      },
      () => {
        fetchCredits(user.id);
        if (onSuccess) onSuccess();
        onClose();
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[450px] bg-slate-950 border-gold/20 text-white font-sans overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl font-heading font-black text-gold uppercase tracking-tight flex items-center gap-2">
             <Zap className="h-6 w-6" /> Reload Analysis Reserve
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs uppercase tracking-widest font-bold">
            Tactical Credit Procurement
          </DialogDescription>
        </DialogHeader>

        {step === 'PHONE' ? (
          <div className="py-6 space-y-6">
            <div className="p-4 bg-gold/5 border border-gold/10 rounded-2xl flex gap-4 items-start">
              <Shield className="h-5 w-5 text-gold shrink-0 mt-1" />
              <p className="text-[11px] text-slate-300 leading-relaxed uppercase tracking-wide">
                To ensure your credits are never lost, please enter your **Phone Number**. This will act as your ID to recover balance if you switch devices.
              </p>
            </div>

            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gold/50" />
                <Input
                  type="tel"
                  placeholder="Enter 10-digit Phone Number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="pl-12 h-14 bg-white/5 border-white/10 rounded-xl focus:ring-gold font-heading font-bold"
                  required
                />
              </div>
              <Button 
                type="submit" 
                disabled={isLinking || phoneNumber.length < 10}
                className="w-full h-14 bg-gold text-black font-black uppercase tracking-widest hover:bg-gold/90 transition-all rounded-xl shadow-glow"
              >
                {isLinking ? 'Verifying...' : 'CONTINUE TO PAYMENT'}
              </Button>
            </form>
          </div>
        ) : (
          <div className="py-2 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {PRICING_PLANS.map((plan) => (
                <button
                  key={plan.credits}
                  onClick={() => handlePurchase(plan.credits, plan.price)}
                  className={`p-4 rounded-2xl border text-left transition-all hover:scale-[1.02] ${
                    plan.highlighted 
                      ? 'bg-gold/10 border-gold shadow-glow' 
                      : 'bg-white/5 border-white/10 hover:border-gold/30'
                  }`}
                >
                  <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">{plan.badge}</p>
                  <p className="text-2xl font-heading font-black text-foreground">{plan.credits} <span className="text-[10px] text-gold uppercase">pts</span></p>
                  <p className="text-sm font-bold text-slate-400 mt-2">₹{plan.price}</p>
                </button>
              ))}
            </div>
            
            <div className="bg-white/5 p-4 rounded-xl border border-white/10">
               <p className="text-[9px] text-muted-foreground uppercase text-center font-bold">
                 Secure Encrypted Payment via Razorpay
               </p>
            </div>
          </div>
        )}

        <DialogFooter className="sm:justify-center border-t border-white/5 pt-4">
          <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest">
            Identity: {phoneNumber || 'Anonymous Cadet'}
          </p>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
