import { useEffect, useState } from 'react';
import { Clock, Trash2, Share2, Copy } from 'lucide-react';
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
    toast.success('Deleted');
  };

  const shareWhatsApp = (item: HistoryItem) => {
    const text = `*SSB GPT - ${item.test_type} Analysis*\n\n${item.result.substring(0, 500)}...\n\nAnalyzed on ssbgpt.lovable.app`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const copyResult = (item: HistoryItem) => {
    navigator.clipboard.writeText(item.result);
    toast.success('Copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const testColors: Record<string, string> = {
    TAT: '#2e6db4',
    WAT: '#1e7d4f',
    SRT: '#c0392b',
    SD: '#8e44ad',
    PIQ: '#c9a84c',
    FULL: '#c9a84c',
  };

  return (
    <div className="space-y-6 scroll-reveal">
      <div className="gold-border-left">
        <h2 className="text-xl md:text-2xl font-heading font-bold">Analysis History</h2>
      </div>

      {items.length === 0 ? (
        <div className="glass-card text-center py-12">
          <Clock className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-body">No analysis history yet. Run an analysis to see results here.</p>
        </div>
      ) : (
        <div className="space-y-3 stagger-children">
          {items.map((item) => (
            <div key={item.id} className="glass-card-subtle">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className="px-2.5 py-1 rounded-lg text-xs font-bold font-heading"
                    style={{
                      background: `${testColors[item.test_type] || '#c9a84c'}22`,
                      color: testColors[item.test_type] || '#c9a84c',
                      border: `1px solid ${testColors[item.test_type] || '#c9a84c'}44`,
                    }}
                  >
                    {item.test_type}
                  </span>
                  <span className="text-xs text-muted-foreground font-body">
                    {format(new Date(item.created_at), 'dd MMM yyyy, hh:mm a')}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => copyResult(item)} className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors" title="Copy Result">
                    <Copy className="h-4 w-4" />
                  </button>
                  <button onClick={() => shareWhatsApp(item)} className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors" title="Share WhatsApp">
                    <Share2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => deleteItem(item.id)} className="p-2 rounded-lg hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <button
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                className="w-full text-left mt-2"
              >
                <p className="text-sm text-muted-foreground font-body line-clamp-2">
                  {item.result.substring(0, 200)}...
                </p>
              </button>

              {expandedId === item.id && (
                <div className="mt-3 pt-3 border-t border-border/30">
                  <div className="prose prose-invert prose-sm max-w-none font-body text-sm text-foreground/90 whitespace-pre-wrap">
                    {item.result}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
