import { useState } from 'react';
import { useAppStore } from '@/store/appStore';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { Shield, Phone, Lock, CheckCircle } from 'lucide-react';

export default function LoginModal() {
  const { setAuthenticated, setUserPhone } = useAppStore();
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = () => {
    if (phone.length < 10) {
      toast.error('Enter a valid phone number');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setStep('OTP');
      toast.success('OTP sent to ' + phone);
    }, 1000);
  };

  const handleVerifyOtp = () => {
    if (otp.length < 6) {
      toast.error('Enter 6-digit OTP');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setUserPhone(phone);
      setAuthenticated(true);
      toast.success('Access Granted — Welcome to SSBGPT');
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="glass-card w-full max-w-md p-10 border-gold/40 border-t-8 space-y-8 shadow-[0_0_100px_rgba(234,179,8,0.1)]">
        <div className="text-center space-y-4">
          <div className="h-20 w-20 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(234,179,8,0.1)]">
            <Shield className="h-10 w-10 text-gold" />
          </div>
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase font-serif">IDENTITY VERIFICATION</h1>
            <p className="text-[10px] uppercase tracking-[0.4em] text-gold font-black">Authorized Personnel Only</p>
          </div>
        </div>

        {step === 'PHONE' ? (
          <div className="space-y-6">
            <div className="relative group">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gold/40 group-focus-within:text-gold transition-colors" />
              <Input 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Mobile Number"
                className="pl-12 h-16 bg-white/5 border-white/10 text-xl font-bold tracking-widest placeholder:text-white/10"
              />
            </div>
            <Button 
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full h-16 bg-gold text-black text-lg font-black tracking-widest uppercase hover:bg-gold/90 transition-all shadow-2xl"
            >
              {loading ? 'Processing...' : 'RECEIVE OTP'}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gold/40 group-focus-within:text-gold transition-colors" />
              <Input 
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                className="pl-12 h-16 bg-white/5 border-white/10 text-xl font-bold tracking-[0.8em] placeholder:text-white/10"
                maxLength={6}
              />
            </div>
            <Button 
              onClick={handleVerifyOtp}
              disabled={loading}
              className="w-full h-16 bg-gold text-black text-lg font-black tracking-widest uppercase hover:bg-gold/90 transition-all shadow-2xl"
            >
              {loading ? 'Verifying...' : 'VERIFY & ENTER'}
            </Button>
            <Button 
              variant="link" 
              onClick={() => setStep('PHONE')}
              className="w-full text-[10px] text-white/40 uppercase tracking-widest font-black"
            >
              Change phone number
            </Button>
          </div>
        )}

        <div className="pt-6 border-t border-white/5 text-center">
          <p className="text-[9px] text-white/20 uppercase tracking-[0.2em] leading-relaxed">
            By accessing SSBGPT, you agree to the terminal's<br/> terms of clinical psychological assessment.
          </p>
        </div>
      </div>
    </div>
  );
}
