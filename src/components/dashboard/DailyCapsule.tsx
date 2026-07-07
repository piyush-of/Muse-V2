'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { Check, X, Sparkles, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Dialog } from '@/components/ui/Dialog';
import { acceptOutfit, rejectOutfit } from '@/actions/capsule';

interface Garment {
  id: string;
  photoUrl: string;
  thumbnailUrl: string;
  category: string;
  color: string;
  season: string;
  formality: string;
}

interface Outfit {
  id: string;
  date: string;
  itemIds: string[];
  reasoning: string;
  status: 'pending' | 'accepted' | 'rejected';
  rejectionReason?: string | null;
  garments?: Garment[];
}

interface DailyCapsuleProps {
  initialOutfits: Outfit[];
}

export default function DailyCapsule({ initialOutfits }: DailyCapsuleProps) {
  const [outfits, setOutfits] = useState<Outfit[]>(initialOutfits);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [acceptedOutfit, setAcceptedOutfit] = useState<Outfit | null>(
    initialOutfits.find(o => o.status === 'accepted') || null
  );
  
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  const activeOutfit = outfits[currentIndex] || null;

  // Next outfit or show wrap-up
  const nextCard = () => {
    setCurrentIndex(prev => prev + 1);
  };

  const handleAccept = async (outfitId: string) => {
    try {
      const res = await acceptOutfit(outfitId);
      if (res.success) {
        setAcceptedOutfit(outfits.find(o => o.id === outfitId) || null);
        triggerConfetti();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRejectClick = (outfitId: string) => {
    setPendingAction(outfitId);
    setRejectOpen(true);
  };

  const confirmRejection = async () => {
    if (!pendingAction) return;
    try {
      const res = await rejectOutfit(pendingAction, rejectReason);
      if (res.success) {
        setRejectOpen(false);
        setRejectReason('');
        setPendingAction(null);
        nextCard();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Drag physics setup
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0.5, 0.9, 1, 0.9, 0.5]);
  const controls = useAnimation();

  const handleDragEnd = async (event: any, info: any) => {
    if (!activeOutfit) return;
    const threshold = 120;
    if (info.offset.x > threshold) {
      // Swiped Right - Accept
      await controls.start({ x: 500, opacity: 0 });
      handleAccept(activeOutfit.id);
    } else if (info.offset.x < -threshold) {
      // Swiped Left - Reject
      await controls.start({ x: -500, opacity: 0 });
      handleRejectClick(activeOutfit.id);
    } else {
      // Return to center
      controls.start({ x: 0, opacity: 1 });
    }
  };

  useEffect(() => {
    controls.set({ x: 0, opacity: 1 });
    x.set(0);
  }, [currentIndex, controls, x]);

  // Confetti Particle Physics
  const triggerConfetti = () => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const colors = ['#4B3B66', '#7C62A8', '#EAE5F0', '#D9A05B', '#EDE9E2'];
    const particles = Array.from({ length: 120 }, () => ({
      x: canvas.width / 2,
      y: canvas.height * 0.7,
      vx: (Math.random() - 0.5) * 15,
      vy: -12 - Math.random() * 8,
      size: 4 + Math.random() * 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      gravity: 0.28,
      spin: Math.random() * 0.2
    }));

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.alpha -= 0.012;
        
        if (p.alpha > 0) {
          alive = true;
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      });

      if (alive) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };
    render();
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div className="relative w-full min-h-[70vh] flex flex-col items-center justify-center">
      <canvas ref={confettiCanvasRef} className="fixed inset-0 pointer-events-none z-50 w-full h-full" />

      {acceptedOutfit ? (
        <Card className="max-w-md w-full text-center p-10 space-y-6 bg-card/65 backdrop-blur-md border border-border/80 shadow-xl">
          <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mx-auto animate-bounce">
            <Sparkles size={28} />
          </div>
          <div className="space-y-2">
            <h2 className="font-serif text-3xl font-bold text-foreground">Look Accepted</h2>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              Your Daily Style decision has been compiled and WearEvents recorded. Enjoy your day!
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 p-4 bg-background/30 rounded-2xl border border-border/40">
            {acceptedOutfit.garments?.map((g) => (
              <div key={g.id} className="relative aspect-[3/4] bg-muted rounded-lg overflow-hidden border border-border/20">
                <img src={g.thumbnailUrl} alt={g.category} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>

          <p className="text-[10px] text-muted-foreground italic">"{acceptedOutfit.reasoning}"</p>

          <Button variant="outline" size="sm" onClick={() => setAcceptedOutfit(null)} className="w-full">
            View Suggestions Deck
          </Button>
        </Card>
      ) : activeOutfit ? (
        <div className="w-full max-w-sm flex flex-col items-center gap-6">
          {/* CARD DECK CONTAINER */}
          <div className="relative w-full aspect-[3/4.2]">
            <motion.div
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={handleDragEnd}
              animate={controls}
              style={{ x, rotate, opacity }}
              className="absolute inset-0 cursor-grab active:cursor-grabbing z-10"
            >
              <Card className="w-full h-full p-6 flex flex-col justify-between bg-card border border-border shadow-2xl rounded-2xl">
                {/* Outfit preview grid */}
                <div className="grid grid-cols-2 gap-3 aspect-square mb-4">
                  {activeOutfit.garments && activeOutfit.garments.length > 0 ? (
                    activeOutfit.garments.map((g) => (
                      <div key={g.id} className="relative bg-background/50 rounded-xl overflow-hidden border border-border/40 group">
                        <img src={g.thumbnailUrl} alt={g.category} className="w-full h-full object-cover" />
                        <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-card/90 border border-border/60 text-[9px] uppercase font-bold text-accent">
                          {g.category}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-2 flex flex-col items-center justify-center text-muted-foreground border border-dashed border-border rounded-xl">
                      <Layers size={24} className="mb-2" />
                      <p className="text-[10px]">No garments available</p>
                    </div>
                  )}
                </div>

                {/* Reasoning text */}
                <div className="space-y-1 mt-auto">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-accent">MUSE Reasoning</p>
                  <p className="text-xs text-foreground font-medium leading-relaxed italic">
                    "{activeOutfit.reasoning}"
                  </p>
                </div>
              </Card>
            </motion.div>

            {/* Back card preview for depth stack effect */}
            {outfits[currentIndex + 1] && (
              <div className="absolute inset-0 scale-[0.96] translate-y-3 opacity-40 blur-xs bg-card border border-border rounded-2xl -z-10 pointer-events-none" />
            )}
          </div>

          {/* CONTROL BUTTONS */}
          <div className="flex justify-center gap-4 w-full">
            <button
              onClick={() => handleRejectClick(activeOutfit.id)}
              className="w-12 h-12 flex items-center justify-center bg-card border border-border rounded-full text-muted-foreground hover:text-red-500 hover:border-red-500/30 active:scale-95 transition-all duration-300 shadow-sm"
              title="Reject Outfit"
            >
              <X size={18} />
            </button>
            <button
              onClick={() => handleAccept(activeOutfit.id)}
              className="w-12 h-12 flex items-center justify-center bg-accent text-accent-foreground rounded-full hover:shadow-lg active:scale-95 transition-all duration-300 shadow-md"
              title="Accept Outfit"
            >
              <Check size={18} />
            </button>
          </div>
        </div>
      ) : (
        <Card className="max-w-md w-full text-center p-8 space-y-4 bg-card/65 backdrop-blur-md border border-border/80">
          <Layers className="mx-auto text-muted-foreground animate-pulse" size={28} />
          <h3 className="font-serif text-xl font-semibold text-foreground">Outfits Exhausted</h3>
          <p className="text-xs text-muted-foreground">
            You've reviewed all suggested outfit combinations for today. Check back tomorrow for a new capsule!
          </p>
        </Card>
      )}

      {/* REJECTION MODAL */}
      <Dialog
        open={rejectOpen}
        onOpenChange={(open) => {
          setRejectOpen(open);
          if (!open) {
            controls.start({ x: 0, opacity: 1 });
            setPendingAction(null);
          }
        }}
        title="Refine Suggestion"
        description="Help the MUSE styling compiler calibrate tomorrow's combination."
      >
        <div className="space-y-4">
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="E.g., Too formal for today, color mismatch, uncomfortable for weather..."
            className="w-full h-24 p-3 bg-background border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent text-xs font-sans"
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setRejectOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={confirmRejection} className="flex-1">
              Log Rejection
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
