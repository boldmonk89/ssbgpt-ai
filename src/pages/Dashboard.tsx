import { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Menu, ClipboardList, BrainCircuit, BookOpen, GraduationCap, FileText, Users, ExternalLink, Swords } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import slide1 from '@/assets/slideshow/slide1.jpg';
import slide2 from '@/assets/slideshow/slide2.jpg';
import slide3 from '@/assets/slideshow/slide3.jpg';
import slide4 from '@/assets/slideshow/slide4.jpg';
import slide5 from '@/assets/slideshow/slide5.jpg';
import slide6 from '@/assets/slideshow/slide6.jpg';

import ssbgptLogo from '@/assets/logo-ssbgpt.png';
import Footer from '@/components/Footer';
import logoTat from '@/assets/logos/logo-tat.png';
import logoWat from '@/assets/logos/logo-wat.png';
import logoSrt from '@/assets/logos/logo-srt.png';
import logoSd from '@/assets/logos/logo-sd.png';
import logoPiq from '@/assets/logos/logo-piq.png';
import logoGto from '@/assets/logos/logo-gto.png';



const SLIDES = [slide1, slide2, slide3, slide4, slide5, slide6];

const TEST_CARDS = [
  {
    label: 'TAT',
    path: '/tat',
    logo: logoTat,
    title: 'Thematic Apperception Test',
    desc: 'Write or upload your TAT stories. Get structure analysis, theme evaluation, OLQ signals, score out of 10, and AI-rewritten improved versions.',
    color: '#2e6db4',
  },
  {
    label: 'WAT',
    path: '/wat',
    logo: logoWat,
    title: 'Word Association Test',
    desc: 'Enter your word-sentence pairs. Each response is checked for word count, positivity, pronouns, and mapped to specific OLQs.',
    color: '#1e7d4f',
  },
  {
    label: 'SRT',
    path: '/srt',
    logo: logoSrt,
    title: 'Situation Reaction Test',
    desc: 'Submit your situation-response pairs. Each is categorized, evaluated for realism and officer qualities, and scored with improvements.',
    color: '#c0392b',
  },
  {
    label: 'SD',
    path: '/sd',
    logo: logoSd,
    title: 'Self Description',
    desc: 'Write all 5 SD paragraphs — Parents, Teachers, Friends, Self, and Qualities to develop. Get authenticity analysis and OLQ coverage.',
    color: '#8e44ad',
  },
  {
    label: 'PIQ',
    path: '/piq',
    logo: logoPiq,
    title: 'Personal Information Questionnaire',
    desc: 'Upload your PIQ form and get an AI-extracted psychological profile with OLQ mapping, personality traits, and leadership indicators.',
    color: '#c9a84c',
  },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-10 scroll-reveal">
      {/* Hero — SSB Mentor inspired */}
      <div className="relative text-center overflow-hidden min-h-[420px] md:min-h-[480px] rounded-2xl flex items-center justify-center">
        {/* Slideshow Background — slow crossfade */}
        {SLIDES.map((src, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-[2000ms] ease-in-out"
            style={{
              opacity: currentSlide === i ? 1 : 0,
              backgroundImage: `url(${src})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        ))}
        {/* Dark gradient overlay */}
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(180deg, hsl(var(--background) / 0.55) 0%, hsl(var(--background) / 0.70) 50%, hsl(var(--background) / 0.90) 100%)',
        }} />

        <div className="relative z-10 px-4 py-12 md:py-16">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img
              src={ssbgptLogo}
              alt="SSBGPT"
              width={80}
              height={80}
              className="h-20 w-20 md:h-24 md:w-24 object-contain drop-shadow-2xl"
            />
          </div>

          {/* Small label tag */}
          <div className="flex justify-center mb-5">
            <span className="px-4 py-1.5 rounded-full text-[11px] font-body font-medium tracking-[0.2em] uppercase text-gold border border-gold/30" style={{
              background: 'hsl(var(--gold) / 0.08)',
            }}>
              AI-Powered SSB Preparation
            </span>
          </div>

          {/* Main headline — Playfair Display with gold italic highlights */}
          <h1 className="font-heading font-bold text-3xl md:text-5xl lg:text-6xl text-foreground mb-4 leading-tight">
            Most SSB Candidates<br />
            Fail For{' '}
            <span className="font-highlight italic text-gold">Predictable</span>
            <br />
            <span className="font-highlight italic text-gold">Reasons.</span>
          </h1>

          {/* Subtitle */}
          <p className="font-body text-muted-foreground text-sm md:text-base max-w-xl mx-auto leading-relaxed mb-8">
            Analyze your TAT, WAT, SRT, SD & PIQ on all <strong className="text-gold">15 Officer Like Qualities</strong> — powered by AI trained on SSB psychology.
          </p>

          {/* CTA Button */}
          <button
            onClick={() => navigate('/full-analysis')}
            className="glass-button-gold inline-flex items-center gap-2 text-sm px-8 py-3"
          >
            Start Full Analysis
          </button>
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
          Tap the <strong className="text-gold">menu button</strong> (top-left) to navigate between tests — PIQ, TAT, WAT, SRT, SD & Full Analysis.
        </p>
      </div>

      {/* Section Title */}
      <div className="gold-border-left">
        <h2 className="text-xl md:text-2xl font-heading font-bold">Analyse Your Tests</h2>
      </div>

      {/* Test Cards */}
      <div className="space-y-4 stagger-children">
        {TEST_CARDS.map((test) => (
          <button
            key={test.path}
            onClick={() => navigate(test.path)}
            className="glass-card liquid-card w-full text-left group cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <img src={test.logo} alt={test.label} loading="lazy" width={56} height={56} className="h-14 w-14 flex-shrink-0 float-slow object-contain" />
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
        ))}
      </div>

      {/* GTO Tasks CTA */}
      <div className="glass-card glow-gold text-center liquid-card">
        <div className="flex justify-center mb-3">
          <img src={logoGto} alt="GTO" loading="lazy" width={48} height={48} className="h-12 w-12 object-contain" />
        </div>
        <h3 className="font-heading font-bold text-lg text-foreground mb-2">GTO Tasks Practice</h3>
        <p className="font-body text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
          Practice Group Discussion with current talking points, solve GPE scenarios, prepare 3-minute Lecturettes, and get Snake Race tips — all AI-powered.
        </p>
        <div className="flex justify-center mt-5">
          <button onClick={() => navigate('/gto')} className="glass-button-gold flex items-center gap-2 text-sm">
            Go to GTO Tasks
          </button>
        </div>
      </div>

      {/* AI Practice CTA */}
      <div className="glass-card glow-gold text-center liquid-card">
        <div className="flex justify-center mb-3">
          <BrainCircuit className="h-6 w-6 text-gold" />
        </div>
        <h3 className="font-heading font-bold text-lg text-foreground mb-2">AI Practice Mode</h3>
        <p className="font-body text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
          Upload a TAT image to get AI-generated stories, enter a word for WAT responses, or type a situation for SRT reactions — all with embedded OLQs.
        </p>
        <div className="flex justify-center mt-5">
          <button onClick={() => navigate('/ai-practice')} className="glass-button-gold flex items-center gap-2 text-sm">
            Go to AI Practice
          </button>
        </div>
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
            Go to Full Analysis
          </button>
        </div>
      </div>

      {/* SSB Mentor Resources Section */}
      <div className="gold-border-left">
        <h2 className="text-xl md:text-2xl font-heading font-bold">SSB Prep Resources</h2>
      </div>

      <div className="glass-card liquid-card">
        {/* Desktop: side by side. Mobile: stacked */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
          {/* Left: Description */}
          <div className="flex-1 min-w-0">
            <p className="font-body text-xs tracking-[0.15em] uppercase text-gold mb-3">Recommended</p>
            <h3 className="font-heading font-bold text-xl md:text-2xl text-foreground mb-2">
              Want Full SSB Practice, Notes & Guidance?
            </h3>
            <p className="font-body text-sm text-muted-foreground leading-relaxed mb-5">
              Combined efforts of <strong className="text-foreground">Recommended Candidates, Ex-NDA cadets & Retired GTOs</strong> — everything you need to crack SSB in one place.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              {[
                { icon: BookOpen, title: '3 Ebooks', desc: 'SSB Blueprint, Test of You & TAT-100 — covering psychology, GTO, interview & mindset' },
                { icon: FileText, title: '80 Real TAT Stories', desc: 'Written by recommended candidates — learn officer-like thinking patterns' },
                { icon: GraduationCap, title: 'CSSS & OPAM Module', desc: 'Interactive practice for the new Stage 1 cognitive screening process' },
                { icon: Users, title: 'Google Drive Resources', desc: 'PGT notes, OIR sets, lecturette topics, interview questions, WAT/SRT practice & more' },
              ].map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl" style={{
                    background: 'hsl(var(--muted) / 0.3)',
                    border: '1px solid hsl(var(--border) / 0.3)',
                  }}>
                    <Icon className="h-5 w-5 text-gold flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-body font-semibold text-sm text-foreground">{item.title}</p>
                      <p className="font-body text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="font-body text-xs text-muted-foreground mb-4">
              Lifetime access, instant delivery — by real SSB achievers, not textbook theory.
            </p>
            <a
              href="https://ssbmentor.com"
              target="_blank"
              rel="noopener noreferrer"
              className="glass-button-gold inline-flex items-center gap-2 text-sm"
            >
              Visit SSB Mentor
            </a>
          </div>

          {/* Right: Video */}
          <div className="w-full md:w-[220px] lg:w-[260px] flex-shrink-0">
            <div className="rounded-xl overflow-hidden border border-border/30">
              <video
                src="/ssbmentor-preview.mp4"
                autoPlay
                loop
                muted
                playsInline
                className="w-full"
                style={{ aspectRatio: '9/16', objectFit: 'cover' }}
              />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
