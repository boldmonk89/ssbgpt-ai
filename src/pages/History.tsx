import { useEffect, useState } from 'react';
import { Clock, Trash2, Share2, Copy, FileText, Lock, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface HistoryItem {
  id: string;
  test_type: string;
  input_data: any;
  result: string;
  created_at: string;
}

export default function HistoryPage() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = () => {
    try {
      const existing = localStorage.getItem('ssbgpt_local_history');
      if (existing) setItems(JSON.parse(existing));
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const deleteItem = (id: string) => {
    const newItems = items.filter((i) => i.id !== id);
    setItems(newItems);
    localStorage.setItem('ssbgpt_local_history', JSON.stringify(newItems));
    toast.success('Dossier Purged');
  };

  const shareWhatsApp = (item: HistoryItem) => {
    const text = `*SSB GPT - ${item.test_type} Analysis*\n\n${item.result.substring(0, 500)}...\n\nAnalyzed on ssbgpt.lovable.app`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const copyResult = (item: HistoryItem) => {
    navigator.clipboard.writeText(item.result);
    toast.success('Record copied to clinical clipboard');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-4">
        <div className="h-10 w-10 border-2 border-gold border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] uppercase tracking-[0.3em] text-gold font-bold">Accessing Secure Archive...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 scroll-reveal pb-20">
      <div className="border-l-4 border-gold pl-6 py-2">
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter font-heading">Clinical Archive</h1>
        <p className="text-muted-foreground font-body text-[10px] uppercase tracking-[0.4em] opacity-60">Candidate Dossier Database</p>
      </div>

      {items.length === 0 ? (
        <div className="glass-card text-center py-20 border-white/5 border-dashed border-2">
          <Lock className="h-12 w-12 text-muted-foreground/20 mx-auto mb-6" />
          <h2 className="text-xl font-bold text-white/40 uppercase tracking-widest">Archive Empty</h2>
          <p className="text-[10px] text-muted-foreground/30 uppercase tracking-[0.2em] mt-2">Generate psychological reports to populate this vault.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-children">
          {items.map((item) => (
            <div key={item.id} className="relative group animate-in zoom-in-95 duration-500">
               {/* Folder Tab */}
               <div className="absolute -top-3 left-6 px-4 py-1.5 bg-[#1a1a1a] border-x border-t border-white/10 rounded-t-xl z-20">
                  <span className="text-[9px] font-black text-gold uppercase tracking-widest">{item.test_type} RECORD</span>
               </div>
               
               <div className={`
                 relative z-10 glass-card p-6 pt-8 transition-all duration-300
                 border-white/10 hover:border-gold/30 
                 ${expandedId === item.id ? 'bg-black/80 ring-1 ring-gold/20' : 'bg-black/40'}
               `}>
                  <div className="flex items-start justify-between">
                     <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <FileText className="h-4 w-4 text-white/40" />
                           <h3 className="text-sm font-bold text-white uppercase tracking-tight">Dossier #{item.id.substring(0, 6)}</h3>
                        </div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                           {format(new Date(item.created_at), 'dd MMM yyyy • HH:mm')}
                        </p>
                     </div>
                     <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => copyResult(item)} className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-gold transition-colors">
                           <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => shareWhatsApp(item)} className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-gold transition-colors">
                           <Share2 className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => deleteItem(item.id)} className="p-2 hover:bg-destructive/10 rounded-lg text-white/40 hover:text-destructive transition-colors">
                           <Trash2 className="h-3.5 w-3.5" />
                        </button>
                     </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-white/5 flex flex-col gap-4">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-warning/60">
                           <ShieldCheck className="h-3 w-3" />
                           <span className="text-[9px] font-bold uppercase tracking-widest">Clinical Synthesis Verified</span>
                        </div>
                        <button 
                          onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                          className="flex items-center gap-1 text-[9px] font-black text-gold uppercase tracking-widest hover:underline"
                        >
                           {expandedId === item.id ? 'Close Record' : 'Access Data'}
                           {expandedId === item.id ? <ChevronUp className="h-2 w-2" /> : <ChevronDown className="h-2 w-2" />}
                        </button>
                     </div>

                     {expandedId === item.id && (
                       <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
                          <div className="p-6 bg-white/[0.02] rounded-xl border border-white/5 prose prose-invert prose-sm max-w-none font-body text-[11px] leading-relaxed text-white/70 whitespace-pre-wrap">
                             {item.result.replace(/\*/g, '')}
                          </div>
                          <p className="mt-4 text-[8px] text-muted-foreground/40 text-center uppercase tracking-[0.3em]">End of Transcript — Strictly Confidential</p>
                       </div>
                     )}
                  </div>
               </div>
               
               {/* Stacked Paper Effect */}
               <div className="absolute inset-x-2 -bottom-1 h-2 bg-white/5 border-x border-b border-white/5 rounded-b-xl z-0" />
               <div className="absolute inset-x-4 -bottom-2 h-2 bg-white/[0.02] border-x border-b border-white/5 rounded-b-xl -z-10" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
