import { Shield, ArrowRight, Sparkles, Menu, FileText, MessageSquare, Zap, UserCircle, ClipboardList } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TEST_CARDS = [
  {
    label: 'PIQ',
    path: '/piq',
    icon: UserCircle,
    title: 'Personal Information Questionnaire',
    desc: 'Upload your PIQ form and get an AI-extracted psychological profile with OLQ mapping, personality traits, and leadership indicators.',
    color: '#c9a84c',
  },
  {
    label: 'TAT',
    path: '/tat',
    icon: FileText,
    title: 'Thematic Apperception Test',
    desc: 'Write or upload your TAT stories. Get structure analysis, theme evaluation, OLQ signals, score out of 10, and AI-rewritten improved versions.',
    color: '#2e6db4',
  },
  {
    label: 'WAT',
    path: '/wat',
    icon: MessageSquare,
    title: 'Word Association Test',
    desc: 'Enter your word-sentence pairs. Each response is checked for word count, positivity, pronouns, and mapped to specific OLQs.',
    color: '#1e7d4f',
  },
  {
    label: 'SRT',
    path: '/srt',
    icon: Zap,
    title: 'Situation Reaction Test',
    desc: 'Submit your situation-response pairs. Each is categorized, evaluated for realism and officer qualities, and scored with improvements.',
    color: '#c0392b',
  },
  {
    label: 'SD',
    path: '/sd',
    icon: Shield,
    title: 'Self Description',
    desc: 'Write all 5 SD paragraphs — Parents, Teachers, Friends, Self, and Qualities to develop. Get authenticity analysis and OLQ coverage.',
    color: '#8e44ad',
  },
];

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-10 scroll-reveal">
      {/* Hero — Liquid Glass */}
      <div className="glass-card glow-gold text-center py-10 md:py-14 relative overflow-hidden">
        <div className="absolute top-6 left-8 h-16 w-16 rounded-full opacity-20 float-slow"
          style={{ background: 'radial-gradient(circle, hsl(var(--gold) / 0.4), transparent)' }} />
        <div className="absolute bottom-8 right-12 h-12 w-12 rounded-full opacity-15 float-medium"
          style={{ background: 'radial-gradient(circle, hsl(var(--accent) / 0.4), transparent)' }} />
        <div className="absolute top-1/2 right-1/4 h-8 w-8 rounded-full opacity-10 float-fast"
          style={{ background: 'radial-gradient(circle, hsl(var(--foreground) / 0.3), transparent)' }} />

        <div className="relative z-10">
          <div className="flex justify-center mb-5">
            <div className="h-16 w-16 border-2 border-gold/50 flex items-center justify-center rounded-2xl glow-gold liquid-card" style={{
              background: 'linear-gradient(135deg, hsl(var(--gold) / 0.2) 0%, hsl(var(--gold) / 0.05) 100%)',
            }}>
              <Shield className="h-8 w-8 text-gold" />
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-heading font-bold text-foreground mb-3">
            <span className="shimmer-text">AI Psych Analysis</span>
          </h1>
          <p className="text-muted-foreground font-body text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Your SSB psychological tests evaluated on <strong className="text-gold">15 Officer Like Qualities</strong> — the core traits the Services Selection Board uses to determine your officer potential.
          </p>

          <div className="flex justify-center mt-6">
            <button
              onClick={() => navigate('/full-analysis')}
              className="glass-button-gold flex items-center gap-2 text-sm"
            >
              <Sparkles className="h-4 w-4" />
              Start Full Analysis
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Hint */}
      <div className="lg:hidden glass-card-subtle flex items-center gap-3 py-3 px-4 border-l-[3px] border-gold">
        <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{
          background: 'linear-gradient(135deg, hsl(var(--gold) / 0.2), hsl(var(--gold) / 0.05))',
        }}>
          <Menu className="h-4 w-4 text-gold" />
        </div>
        <p className="font-body text-xs text-muted-foreground leading-snug">
          Tap the <strong className="text-gold">☰ menu button</strong> (top-left) to navigate between tests — PIQ, TAT, WAT, SRT, SD & Full Analysis.
        </p>
      </div>

      {/* Section Title */}
      <div className="gold-border-left">
        <h2 className="text-xl md:text-2xl">Analyse Your Tests</h2>
      </div>

      {/* Test Cards */}
      <div className="space-y-4 stagger-children">
        {TEST_CARDS.map((test) => {
          const Icon = test.icon;
          return (
            <button
              key={test.path}
              onClick={() => navigate(test.path)}
              className="glass-card liquid-card w-full text-left group cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center flex-shrink-0 float-slow" style={{
                  background: `linear-gradient(135deg, ${test.color}33 0%, ${test.color}11 100%)`,
                  border: `1px solid ${test.color}44`,
                }}>
                  <Icon className="h-6 w-6" style={{ color: test.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-heading font-bold text-xl" style={{ color: test.color }}>
                      {test.label}
                    </span>
                    <span className="text-muted-foreground font-body text-xs hidden sm:inline">
                      {test.title}
                    </span>
                  </div>
                  <p className="font-body text-sm text-muted-foreground leading-relaxed">
                    {test.desc}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-gold group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Full Analysis CTA */}
      <div className="glass-card glow-gold text-center liquid-card">
        <div className="flex justify-center mb-3">
          <ClipboardList className="h-6 w-6 text-gold" />
        </div>
        <h3 className="font-heading font-bold text-lg text-foreground mb-2">Full Psych Analysis</h3>
        <p className="font-body text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
          Upload a single PDF with all your tests, or combine individual test analyses into one comprehensive SSB assessment report with cross-test consistency check and 15 OLQ ratings.
        </p>
        <div className="flex justify-center mt-5">
          <button onClick={() => navigate('/full-analysis')} className="glass-button-gold flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4" />
            Go to Full Analysis
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
