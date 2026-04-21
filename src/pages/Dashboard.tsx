import { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, Menu, ClipboardList, BrainCircuit, BookOpen, GraduationCap, FileText, Users, ExternalLink, Swords, Wallet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion, type Variants } from 'framer-motion';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 100,
      damping: 15
    }
  }
};

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
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-10 scroll-reveal"
    >
      {/* Hero — SSB Mentor inspired */}
      <motion.div variants={itemVariants} className="relative text-center overflow-hidden min-h-[420px] md:min-h-[480px] rounded-2xl flex items-center justify-center">
        {/* Slideshow Background — slow crossfade */}
        {SLIDES.map((src, i) => (
          <div
            key={i}
            className="absolute inset-0 transition-opacity duration-[2s] ease-in-out"
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
          <h1 className="text-2xl md:text-4xl lg:text-5xl leading-tight mb-4 tracking-tight">
            Most SSB Candidates Fail For<br />
            <span className="text-gold">Predictable Reasons.</span>
          </h1>

          {/* Subtitle */}
          <p className="font-body text-muted-foreground text-sm md:text-base max-w-xl mx-auto leading-relaxed mb-8">
            Analyze your TAT, WAT, SRT, SD & PIQ on all <strong className="text-gold">15 Officer Like Qualities</strong> — powered by AI trained on SSB psychology.
          </p>

          {/* CTA Button */}
          <Button
            onClick={() => navigate('/full-analysis')}
            variant="default"
            size="lg"
            className="w-fit"
          >
            Start Full Analysis
          </Button>
        </div>
      </motion.div>

      {/* Mobile Navigation Hint */}
      <motion.div variants={itemVariants} className="lg:hidden glass-card-subtle flex items-center gap-3 py-3 px-4 border-l-[3px] border-gold">
        <div className="h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{
          background: 'linear-gradient(135deg, hsl(var(--gold) / 0.2), hsl(var(--gold) / 0.05))',
        }}>
          <Menu className="h-4 w-4 text-gold" />
        </div>
        <p className="font-body text-xs text-muted-foreground leading-snug">
          Tap the <strong className="text-gold">menu button</strong> (top-left) to navigate between tests — PIQ, TAT, WAT, SRT, SD & Full Analysis.
        </p>
      </motion.div>

      {/* Section Title */}
      <motion.div variants={itemVariants} className="gold-border-left">
        <h2 className="text-xl md:text-2xl">Analyse Your Tests</h2>
      </motion.div>

      {/* Test Cards */}
      <motion.div variants={containerVariants} className="space-y-4">
        {TEST_CARDS.map((test) => (
          <motion.button
            key={test.path}
            variants={itemVariants}
            whileHover={{ scale: 1.01, translateY: -4 }}
            whileTap={{ scale: 0.99 }}
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
          </motion.button>
        ))}
      </motion.div>

      {/* GTO Tasks CTA */}
      <motion.div 
        variants={itemVariants}
        whileHover={{ scale: 1.01, translateY: -4 }}
        className="glass-card glow-gold text-center liquid-card"
      >
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
      </motion.div>

      {/* AI Practice CTA */}
      <motion.div 
        variants={itemVariants}
        whileHover={{ scale: 1.01, translateY: -4 }}
        className="glass-card glow-gold text-center liquid-card"
      >
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
      </motion.div>

      {/* Full Analysis CTA */}
      <motion.div 
        variants={itemVariants}
        whileHover={{ scale: 1.01, translateY: -4 }}
        className="glass-card glow-gold text-center liquid-card"
      >
        <div className="flex justify-center mb-3">
          <ClipboardList className="h-6 w-6 text-gold" />
        </div>
        <h3 className="font-heading font-bold text-lg text-foreground mb-2">SSB GPT Analysis</h3>
        <p className="font-body text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
          Upload a single PDF with all your tests, or combine individual test analyses into one comprehensive SSB assessment report with cross-test consistency check and 15 OLQ ratings.
        </p>
        <div className="flex justify-center mt-5">
          <button onClick={() => navigate('/full-analysis')} className="glass-button-gold flex items-center gap-2 text-sm">
            Go to SSB GPT
          </button>
        </div>
      </motion.div>




      <Footer />
    </motion.div>
  );
}
