import { OLQ_NAMES, OLQ_FACTORS } from '@/store/appStore';
import { Shield, Brain, Heart, Flame, Dumbbell, ArrowRight, Sparkles, Menu } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FACTOR_ICONS: Record<string, any> = {
  I: Brain,
  II: Heart,
  III: Flame,
  IV: Dumbbell,
};

const FACTOR_GRADIENTS: Record<string, string> = {
  I: 'linear-gradient(135deg, #2e6db433 0%, #2e6db411 100%)',
  II: 'linear-gradient(135deg, #1e7d4f33 0%, #1e7d4f11 100%)',
  III: 'linear-gradient(135deg, #c9a84c33 0%, #c9a84c11 100%)',
  IV: 'linear-gradient(135deg, #c0392b33 0%, #c0392b11 100%)',
};

export default function DashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-10 scroll-reveal">
      {/* Hero — Liquid Glass */}
      <div className="glass-card glow-gold text-center py-10 md:py-14 relative overflow-hidden">
        {/* Floating decorative elements */}
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
              Start Analysis
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Nav Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 stagger-children">
        {[
          { label: 'PIQ', path: '/piq', desc: 'Personal Info' },
          { label: 'TAT', path: '/tat', desc: 'Stories' },
          { label: 'WAT', path: '/wat', desc: 'Word Assoc.' },
          { label: 'SRT', path: '/srt', desc: 'Situations' },
          { label: 'SD', path: '/sd', desc: 'Self Desc.' },
        ].map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="glass-card-subtle liquid-card text-center py-5 cursor-pointer group"
          >
            <span className="font-heading font-bold text-lg text-gold group-hover:text-foreground transition-colors">
              {item.label}
            </span>
            <p className="text-[11px] text-muted-foreground font-body mt-1">{item.desc}</p>
          </button>
        ))}
      </div>

      {/* What SSB Judges */}
      <div className="gold-border-left">
        <h2 className="text-xl md:text-2xl">What Does SSB Judge You On?</h2>
      </div>

      <div className="glass-card-subtle liquid-card">
        <p className="font-body text-sm text-foreground/90 leading-relaxed">
          During the SSB interview, the <strong className="text-gold">Psychologist</strong> evaluates you through four tests — 
          <strong> TAT</strong>, <strong>WAT</strong>, <strong>SRT</strong>, and <strong>SD</strong>. 
          These reveal your <strong className="text-gold">subconscious mind, thought patterns, emotional stability, and leadership potential</strong>.
        </p>
        <p className="font-body text-sm text-muted-foreground leading-relaxed mt-3">
          Every response is mapped against <strong className="text-foreground">15 Officer Like Qualities</strong> grouped into 
          4 factors. The psychologist looks for consistency — your stories, sentences, reactions, 
          and paragraphs should all reflect the same personality.
        </p>
      </div>

      {/* 4 Factors */}
      <div className="gold-border-left">
        <h2 className="text-xl md:text-2xl">The 4 Factors & 15 OLQs</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 stagger-children">
        {Object.entries(OLQ_FACTORS).map(([key, factor]) => {
          const Icon = FACTOR_ICONS[key] || Shield;
          return (
            <div key={key} className="glass-card liquid-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center float-slow" style={{
                  background: FACTOR_GRADIENTS[key],
                  border: `1px solid ${factor.color}44`,
                }}>
                  <Icon className="h-5 w-5" style={{ color: factor.color }} />
                </div>
                <h3 className="font-heading font-bold text-base" style={{ color: factor.color }}>
                  {factor.label}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {factor.keys.map((k) => (
                  <span key={k} className="olq-badge border-border/30 text-foreground/80 text-[11px] liquid-card">
                    {OLQ_NAMES[k]}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* OLQ Descriptions */}
      <div className="gold-border-left">
        <h2 className="text-xl md:text-2xl">Understanding Each OLQ</h2>
      </div>

      <div className="glass-card">
        <div className="space-y-4 stagger-children">
          {[
            { name: 'Effective Intelligence', desc: 'Ability to assess a situation accurately and arrive at practical solutions using available resources.' },
            { name: 'Reasoning Ability', desc: 'Capacity to think logically and draw valid conclusions from given information.' },
            { name: 'Organizing Ability', desc: 'Skill in planning, arranging resources, and coordinating efforts to achieve objectives.' },
            { name: 'Power of Expression', desc: 'Ability to communicate ideas clearly and convincingly — both written and verbal.' },
            { name: 'Social Adaptability', desc: 'Ease with which you adjust to different social environments, people, and situations.' },
            { name: 'Cooperation', desc: 'Willingness to work with others harmoniously toward a common goal without ego clashes.' },
            { name: 'Sense of Responsibility', desc: 'Dependability and accountability — you own your tasks and follow through on commitments.' },
            { name: 'Initiative', desc: 'Ability to act independently, take the first step, and lead when required without waiting for instructions.' },
            { name: 'Self Confidence', desc: 'Belief in your own abilities and judgment, reflected in calm and composed decision-making.' },
            { name: 'Speed of Decision', desc: 'Ability to make quick, sound decisions under pressure without unnecessary hesitation.' },
            { name: 'Ability to Influence', desc: 'Power to motivate and guide others toward a course of action through persuasion and example.' },
            { name: 'Liveliness', desc: 'Maintaining optimism, enthusiasm, and energy even in challenging or monotonous situations.' },
            { name: 'Determination', desc: 'Persistence and willpower to achieve your goals despite obstacles and setbacks.' },
            { name: 'Courage', desc: 'Ability to face danger, difficulty, or uncertainty without fear — physical and moral courage.' },
            { name: 'Stamina', desc: 'Physical and mental endurance to sustain prolonged effort under pressure.' },
          ].map((olq, i) => (
            <div key={i} className="flex gap-3 items-start group">
              <span className="text-gold font-heading font-bold text-sm min-w-[24px] group-hover:scale-110 transition-transform">{i + 1}.</span>
              <div>
                <span className="font-heading font-bold text-sm text-foreground">{olq.name}</span>
                <span className="text-muted-foreground font-body text-sm"> — {olq.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="glass-card-subtle text-center liquid-card">
        <p className="font-body text-sm text-muted-foreground leading-relaxed">
          Use the sidebar to navigate to each test — <strong className="text-foreground">PIQ, TAT, WAT, SRT, SD</strong> — and get AI-powered analysis 
          of your responses. For a combined evaluation, use <strong className="text-gold">Full Psych Analysis</strong>.
        </p>
        <div className="flex justify-center mt-4">
          <button onClick={() => navigate('/full-analysis')} className="glass-button-accent flex items-center gap-2 text-xs">
            <ArrowRight className="h-3.5 w-3.5" />
            Go to Full Analysis
          </button>
        </div>
      </div>
    </div>
  );
}
