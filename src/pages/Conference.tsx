import { useState } from 'react';
import { MessageSquare, Users, ShieldAlert, BadgeInfo, MessageCircle, Send, Loader2, Info } from 'lucide-react';
import { callGemini } from '@/lib/gemini';
import { toast } from 'sonner';
import { AnalysisOutput } from '@/components/AnalysisOutput';

const CONFERENCE_SYSTEM_PROMPT = `You are an SSB Board President/Daughter of the President (expert assessor). 
The user will tell you what questions were asked to them during their SSB Conference.

Your task is to analyze if the candidate was a 'Borderline' case or not.
In SSB, a conference that lasts longer than usual or involves non-standard questions (not about stay/food) usually indicates a borderline case where GTO, IO, and Psych are discussing alignment.

Based on the questions, categorize the candidate into one of these levels:
- RECOMMENDABLE BORDERLINE (Strong case, almost through)
- HIGH BORDERLINE (Positive discussion, slight doubt)
- POTENTIAL (Average, depends on consensus)
- LOW BORDERLINE (Negative leaning, struggling for passing marks)
- NOT RECOMMENDABLE (Assessed as not suitable)

Explain WHY you chose this level. Use a professional, serious, and authoritative tone. Use Hinglish intermittently for clarity.
Mention common SSB psychology: 'Conference is done to see if IO, GTO, and Psych ASSESSMENT matches.'`;

const ConferencePage = () => {
  const [questions, setQuestions] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState('');

  const analyzeConference = async () => {
    if (!questions.trim()) {
      toast.error('Please enter the questions you were asked');
      return;
    }

    setLoading(true);
    setAnalysis('');
    try {
      const response = await callGemini(
        `Calculate my borderline status based on these conference questions: "${questions}"`,
        null,
        CONFERENCE_SYSTEM_PROMPT
      );
      setAnalysis(response);
      toast.success('Conference Assessment Complete');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Hero Section */}
      <div className="glass-card glow-gold overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-transparent opacity-50" />
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-2xl bg-gold/20 border border-gold/30 shadow-[0_0_20px_rgba(207,169,78,0.2)]">
              <Users className="h-8 w-8 text-gold" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-heading font-black tracking-tight text-white mb-1">
                SSB <span className="shimmer-text">Conference</span>
              </h1>
              <p className="text-muted-foreground text-sm font-body uppercase tracking-[0.2em] font-bold opacity-70">
                Borderline Status Assessment
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 items-center mt-8 pt-8 border-t border-white/5">
            <div className="space-y-4">
              <h3 className="text-xl font-heading font-bold text-white flex items-center gap-2">
                <BadgeInfo className="h-5 w-5 text-gold" />
                What is the Conference?
              </h3>
              <p className="text-slate-300 leading-relaxed font-body">
                The reason conference is done is to see how complete a person is. Because the IO, GTO, and Psych have all seen you in different perspectives and they want to know if all of their assessment matches.
              </p>
              <div className="bg-slate-900/50 p-4 rounded-xl border border-white/5 italic text-sm text-gold/80">
                "Usually questions are asked about your stay and suggestions. But if they ask unique questions, you might be a 'Possible' (Borderline) candidate."
              </div>
            </div>
            
            <div className="glass-card p-6 bg-gold/5 border-gold/20">
              <div className="flex items-start gap-4">
                <ShieldAlert className="h-6 w-6 text-gold flex-shrink-0 mt-1" />
                <div>
                  <h4 className="font-heading font-bold text-white mb-2 uppercase text-sm tracking-wider">The "Borderline" Logic</h4>
                  <p className="text-xs text-slate-300 font-body leading-relaxed">
                    If assessors are not 100% sure about you, they have a discussion. If they were asked a bunch of questions which were not asked earlier, it's a strong signal of a case being discussed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="grid lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12 space-y-6">
          <div className="glass-card p-6 md:p-8">
            <h3 className="text-lg font-heading font-bold text-white mb-6 flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-gold" />
              Check your Recommendation Level
            </h3>
            
            <div className="space-y-4">
              <label className="text-xs font-heading font-bold uppercase tracking-widest text-slate-400">
                Questions asked in Conference
              </label>
              <textarea
                value={questions}
                onChange={(e) => setQuestions(e.target.value)}
                placeholder="Ex: How was your stay? Any suggestions? If you had to select one person from your group, who would it be and why? Why were you low in GTO? etc."
                className="w-full min-h-[150px] bg-slate-900/50 border border-white/10 rounded-2xl p-4 text-white font-body text-sm focus:ring-1 focus:ring-gold/50 transition-all outline-none resize-none"
              />
              
              <div className="flex items-center justify-between pt-4">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest px-4 py-2 bg-white/5 rounded-full border border-white/5">
                  <Info className="h-3 w-3" />
                  AI analyzes assessor intent
                </div>
                
                <button
                  onClick={analyzeConference}
                  disabled={loading}
                  className="flex items-center gap-2 px-8 py-3 bg-gold text-black rounded-xl text-sm font-bold hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(207,169,78,0.3)] disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing intentionality...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Check Borderline Status
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {analysis && (
            <div className="animate-in slide-in-from-bottom-4 duration-500">
              <AnalysisOutput content={analysis} title="SSB Borderline Assessment" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConferencePage;
