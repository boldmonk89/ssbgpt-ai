import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const RAZORPAY_KEY = 'rzp_live_SfNPLm3LNlGokQ';

interface RazorpayOptions {
  amount: number;
  currency: string;
  name: string;
  description: string;
  handler: (response: any) => void;
  prefill: {
    name: string;
    email: string;
  };
  theme: {
    color: string;
  };
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const processPayment = async (
  credits: number, 
  price: number, 
  user: { id: string; email: string; name: string },
  onSuccess: () => void
) => {
  if (!window.Razorpay) {
    const loaded = await loadRazorpay();
    if (!loaded) {
      toast.error('Razorpay SDK failed to load. Check your internet connection.');
      return;
    }
  }

  const options: RazorpayOptions = {
    amount: price * 100, // Razorpay works in paise
    currency: 'INR',
    name: 'SSB GPT AI',
    description: `Purchase ${credits} Credits`,
    image: '/assets/logo-ssbgpt.png',
    handler: async function (response: any) {
      if (response.razorpay_payment_id) {
        try {
          // Update credits in Database
          // In a real app, you should verify payment on the backend
          const { data, error: fetchError } = await supabase
            .from('candidate_profiles')
            .select('credits')
            .eq('user_id', user.id)
            .single();

          if (fetchError) throw fetchError;

          const newTotal = (data.credits || 0) + credits;

          const { error: updateError } = await supabase
            .from('candidate_profiles')
            .update({ credits: newTotal })
            .eq('user_id', user.id);

          if (updateError) throw updateError;

          toast.success(`Payment Successful! ${credits} credits added.`);
          onSuccess();
        } catch (err) {
          console.error('Credit update error:', err);
          toast.error('Payment verified but failed to update credits. Please contact support.');
        }
      }
    },
    prefill: {
      name: user.name,
      email: user.email,
    },
    theme: {
      color: '#CFB14E', // Gold
    },
  };

  const rzp = new window.Razorpay(options);
  rzp.on('payment.failed', function (response: any) {
    toast.error('Payment Failed: ' + response.error.description);
  });
  rzp.open();
};
