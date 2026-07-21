'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, type Variants } from 'framer-motion';
import { Sparkles, ArrowRight, Camera, Cpu, Compass, Shield, HelpCircle, Layers, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import LivingBackground from '@/components/ui/LivingBackground';

export default function LandingPage() {
  const [isDark] = useState(false); // Default to light theme for landing aesthetic
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setFaqOpen(faqOpen === index ? null : index);
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const },
    },
  };

  return (
    <div className="film-grain relative min-h-screen overflow-x-hidden selection:bg-accent/10 selection:text-accent">
      <LivingBackground isDark={isDark} />

      {/* HEADER NAV */}
      <header className="relative z-10 flex items-center justify-between px-6 sm:px-12 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
            <span className="text-white font-serif font-bold text-sm leading-none">M</span>
          </div>
          <span className="font-serif font-semibold text-xl tracking-tight text-foreground">MUSE</span>
        </div>
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#about" className="hover:text-foreground transition-colors">Philosophy</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
        </nav>
        <div className="flex items-center gap-4">
          <Link href="/auth/login">
            <Button variant="outline" size="sm">Enter Platform</Button>
          </Link>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 pt-16 pb-24 text-center">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/5 border border-accent/10 text-accent text-[10px] font-bold uppercase tracking-widest">
            <Sparkles size={11} />
            <span>MUSE fashion intelligence v2</span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="font-serif text-5xl sm:text-7xl font-bold tracking-tight text-foreground leading-[1.08] max-w-4xl mx-auto"
          >
            Decide less.<br />
            Dress beautifully.
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto font-sans leading-relaxed"
          >
            MUSE removes the daily "what do I wear" decision using the clothes you already own. An editorial, context-aware styling engine designed to maximize wardrobe utility.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/signup">
              <Button size="lg" className="w-full sm:w-auto flex items-center gap-2">
                <span>Catalogue Your Closet</span>
                <ArrowRight size={14} />
              </Button>
            </Link>
            <a href="#features">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Explore Features
              </Button>
            </a>
          </motion.div>

          {/* Hero Image Mockup with spring entry */}
          <motion.div
            variants={itemVariants}
            className="pt-12 max-w-4xl mx-auto"
          >
            <div className="relative aspect-video rounded-2xl overflow-hidden glass-panel border border-border/80 shadow-2xl p-2 bg-card/30">
              <div className="w-full h-full rounded-xl bg-paper/60 border border-border/40 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-linear-to-tr from-accent/5 to-transparent pointer-events-none" />
                <div className="text-center p-8 space-y-4">
                  <div className="flex justify-center gap-3">
                    <div className="w-20 h-28 rounded-lg bg-card border border-border shadow-sm flex items-center justify-center text-accent/30 font-serif text-xl">Tops</div>
                    <div className="w-20 h-28 rounded-lg bg-card border border-border shadow-sm flex items-center justify-center text-accent/30 font-serif text-xl">Bottom</div>
                    <div className="w-20 h-28 rounded-lg bg-card border border-border shadow-sm flex items-center justify-center text-accent/30 font-serif text-xl">Shoes</div>
                  </div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Capsule Suggestion #1 — Smart Casual Briefing look</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* STATS SECTION */}
      <section className="relative z-10 border-y border-border/60 bg-card/20 backdrop-blur-sm py-16">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="font-serif text-4xl sm:text-5xl font-bold text-accent">85%</p>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-2">Avg. Acceptance Rate</p>
          </div>
          <div>
            <p className="font-serif text-4xl sm:text-5xl font-bold text-accent">3x</p>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-2">More Wear Frequency</p>
          </div>
          <div>
            <p className="font-serif text-4xl sm:text-5xl font-bold text-accent">24h</p>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-2">Outfit Prep Compilation</p>
          </div>
          <div>
            <p className="font-serif text-4xl sm:text-5xl font-bold text-accent">100%</p>
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mt-2">Owned Clothes Focus</p>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="relative z-10 max-w-6xl mx-auto px-6 py-28">
        <div className="text-center mb-20 space-y-3">
          <span className="text-[10px] uppercase tracking-widest font-bold text-accent">MUSE Core Capabilities</span>
          <h2 className="font-serif text-3xl sm:text-5xl font-bold text-foreground">Decision Compression</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">We analyze your wardrobe to give you fewer, faster, and more trustworthy choices.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="glass-panel rounded-2xl p-8 bg-card/50 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-accent/5 border border-accent/10 flex items-center justify-center text-accent mb-6">
                <Camera size={18} />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-3">AI Auto-Tagging</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Upload garment photos via camera. The system auto-extracts categories, colors, seasons, and formality structures via Google Gemini.
              </p>
            </div>
            <p className="text-[10px] font-bold text-accent uppercase tracking-widest mt-8">Powered by Gemini 1.5</p>
          </div>

          {/* Card 2 */}
          <div className="glass-panel rounded-2xl p-8 bg-card/50 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-accent/5 border border-accent/10 flex items-center justify-center text-accent mb-6">
                <Cpu size={18} />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-3">Context Capsules</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Daily pre-compiled combinations based on today's local weather and upcoming calendar events. Zero page load latency.
              </p>
            </div>
            <p className="text-[10px] font-bold text-accent uppercase tracking-widest mt-8">Decide in seconds</p>
          </div>

          {/* Card 3 */}
          <div className="glass-panel rounded-2xl p-8 bg-card/50 flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-accent/5 border border-accent/10 flex items-center justify-center text-accent mb-6">
                <Compass size={18} />
              </div>
              <h3 className="font-serif text-xl font-semibold mb-3">Gap Audit</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Scans closet balance to flag layout gaps. Recommends high-utility additions to multiply matching options from owned items.
              </p>
            </div>
            <p className="text-[10px] font-bold text-accent uppercase tracking-widest mt-8">Maximize Wardrobe DNA</p>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="relative z-10 border-t border-border/60 bg-card/25 py-28">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16 space-y-3">
            <span className="text-[10px] uppercase tracking-widest font-bold text-accent">Transparent Value</span>
            <h2 className="font-serif text-3xl sm:text-5xl font-bold text-foreground">Standard Plans</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-stretch max-w-2xl mx-auto">
            {/* Free */}
            <div className="glass-panel rounded-2xl p-8 bg-card/50 flex flex-col justify-between border border-border">
              <div>
                <h3 className="font-serif text-xl font-semibold mb-1">Standard</h3>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-6">For personal closets</p>
                <div className="mb-6">
                  <span className="font-serif text-4xl font-bold text-foreground">$0</span>
                  <span className="text-xs text-muted-foreground font-sans"> / free forever</span>
                </div>
                <ul className="space-y-3 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle size={12} className="text-accent" /> Up to 50 garments digitised</li>
                  <li className="flex items-center gap-2"><CheckCircle size={12} className="text-accent" /> Daily capsule outfit layouts</li>
                  <li className="flex items-center gap-2"><CheckCircle size={12} className="text-accent" /> Core style DNA traits</li>
                </ul>
              </div>
              <Link href="/auth/signup" className="mt-8">
                <Button variant="outline" className="w-full">Get Started</Button>
              </Link>
            </div>

            {/* Premium */}
            <div className="glass-panel rounded-2xl p-8 bg-card/50 flex flex-col justify-between border-2 border-accent shadow-lg">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-serif text-xl font-semibold">Premium</h3>
                  <span className="text-[9px] bg-accent/10 border border-accent/20 px-2 py-0.5 rounded text-accent font-bold uppercase tracking-wider">Most Picked</span>
                </div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium mb-6">Unlimited wardrobes</p>
                <div className="mb-6">
                  <span className="font-serif text-4xl font-bold text-foreground">$9</span>
                  <span className="text-xs text-muted-foreground font-sans"> / month</span>
                </div>
                <ul className="space-y-3 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle size={12} className="text-accent" /> Unlimited closet tags</li>
                  <li className="flex items-center gap-2"><CheckCircle size={12} className="text-accent" /> Full Gemini Pro priority analytics</li>
                  <li className="flex items-center gap-2"><CheckCircle size={12} className="text-accent" /> Advanced weather & travel compiler</li>
                </ul>
              </div>
              <Link href="/auth/signup" className="mt-8">
                <Button className="w-full">Unlock Premium</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section id="faq" className="relative z-10 max-w-3xl mx-auto px-6 py-28">
        <div className="text-center mb-16 space-y-3">
          <span className="text-[10px] uppercase tracking-widest font-bold text-accent"><HelpCircle size={12} className="inline mr-1" /> FAQ</span>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground">Common Questions</h2>
        </div>

        <div className="space-y-4">
          {[
            {
              q: "How does the AI scan my clothes?",
              a: "When you upload a photo, MUSE sends the image payload securely to the Google Gemini Vision model. The model automatically classifies the item's category, season suitability, formality, and extracts its primary fabric color code in seconds."
            },
            {
              q: "Will you show me items to buy?",
              a: "No. MUSE is not a shopping catalog or funnel. Our product thesis is decision compression: helping you wear and maximize the items you already own. Recommendations are only surfaced to bridge severe styling gaps."
            },
            {
              q: "Is my personal image data secure?",
              a: "Absolutely. All images are hosted on secure, private Cloudinary folders linked exclusively to your profile ID. We do not sell or share wardrobe data."
            }
          ].map((faq, idx) => (
            <div key={idx} className="glass-panel rounded-xl overflow-hidden">
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full px-6 py-4 flex items-center justify-between text-left font-serif text-base font-semibold text-foreground hover:bg-card/40 transition-colors"
              >
                <span>{faq.q}</span>
                <span className="text-xs text-muted-foreground">{faqOpen === idx ? "−" : "+"}</span>
              </button>
              {faqOpen === idx && (
                <div className="px-6 pb-4 pt-1 text-xs text-muted-foreground leading-relaxed font-sans border-t border-border/20 bg-card/10">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 border-t border-border/60 bg-card/10 py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
              <span className="text-white font-serif font-bold text-[10px] leading-none">M</span>
            </div>
            <span className="font-serif font-semibold text-sm tracking-tight text-foreground">MUSE</span>
          </div>
          <p className="text-[10px] text-muted-foreground font-sans">
            © {new Date().getFullYear()} MUSE platform. All rights reserved. Zero shopping funnels.
          </p>
          <div className="flex gap-4 text-[10px] font-semibold text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}