import { OLQ_NAMES, OLQ_FACTORS } from '@/store/appStore';
import { Shield, Brain, Heart, Flame, Dumbbell } from 'lucide-react';

const FACTOR_ICONS: Record<string, any> = {
  I: Brain,
  II: Heart,
  III: Flame,
  IV: Dumbbell,
};

export default function DashboardPage() {
  return (
    <div className="space-y-8 scroll-reveal">
      {/* Hero */}
      <div className="glass-card glow-gold text-center py-8 md:py-12">
        <div className="flex justify-center mb-4">
          <div className="h-14 w-14 border-2 border-gold/60 flex items-center justify-center rounded-2xl glow-gold" style={{
            background: 'linear-gradient(135deg, hsl(var(--gold) / 0.2) 0%, hsl(var(--gold) / 0.05) 100%)',
          }}>
            <Shield className="h-7 w-7 text-gold" />
          </div>
        </div>
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-3">
          AI Psych Analysis
        </h1>
        <p className="text-muted-foreground font-body text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
          Your SSB psychological tests are evaluated on <strong className="text-gold">15 Officer Like Qualities (OLQs)</strong> — the core traits the Services Selection Board uses to determine if you have the personality of a future officer.
        </p>
      </div>

      {/* What SSB Judges You On */}
      <div className="gold-border-left">
        <h2 className="text-xl md:text-2xl">What Does SSB Judge You On?</h2>
      </div>

      <div className="glass-card-subtle">
        <p className="font-body text-sm text-foreground/90 leading-relaxed">
          During the SSB interview, the <strong className="text-gold">Psychologist</strong> evaluates you through four psychological tests — 
          <strong> TAT</strong> (Thematic Apperception Test), <strong>WAT</strong> (Word Association Test), 
          <strong> SRT</strong> (Situation Reaction Test), and <strong>SD</strong> (Self Description). 
          Together, these tests reveal your <strong className="text-gold">subconscious mind, thought patterns, emotional stability, and leadership potential</strong>.
        </p>
        <p className="font-body text-sm text-muted-foreground leading-relaxed mt-3">
          Every response you write is mapped against <strong className="text-foreground">15 Officer Like Qualities</strong> grouped into 
          4 factors. The psychologist looks for consistency across all tests — your TAT stories, WAT sentences, SRT reactions, 
          and SD paragraphs should all reflect the same personality traits.
        </p>
      </div>

      {/* 4 Factors */}
      <div className="gold-border-left">
        <h2 className="text-xl md:text-2xl">The 4 Factors & 15 OLQs</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(OLQ_FACTORS).map(([key, factor]) => {
          const Icon = FACTOR_ICONS[key] || Shield;
          return (
            <div key={key} className="glass-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{
                  background: `linear-gradient(135deg, ${factor.color}33 0%, ${factor.color}11 100%)`,
                  border: `1px solid ${factor.color}44`,
                }}>
                  <Icon className="h-4.5 w-4.5" style={{ color: factor.color }} />
                </div>
                <h3 className="font-heading font-bold text-base" style={{ color: factor.color }}>
                  {factor.label}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {factor.keys.map((k) => (
                  <span key={k} className="olq-badge border-border/30 text-foreground/80 text-[11px]">
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
        <div className="space-y-4">
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
            <div key={i} className="flex gap-3 items-start">
              <span className="text-gold font-heading font-bold text-sm min-w-[24px]">{i + 1}.</span>
              <div>
                <span className="font-heading font-bold text-sm text-foreground">{olq.name}</span>
                <span className="text-muted-foreground font-body text-sm"> — {olq.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How This Tool Helps */}
      <div className="glass-card-subtle text-center">
        <p className="font-body text-sm text-muted-foreground leading-relaxed">
          Use the sidebar to navigate to each test — <strong className="text-foreground">PIQ, TAT, WAT, SRT, SD</strong> — and get AI-powered analysis 
          of your responses mapped against these 15 OLQs. For a combined evaluation, use the <strong className="text-gold">Full Psych Analysis</strong> page.
        </p>
      </div>
    </div>
  );
}
