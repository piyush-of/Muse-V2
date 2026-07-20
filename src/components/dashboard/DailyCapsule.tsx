'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { Check, X, Sparkles, RefreshCw, Layers, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Dialog } from '@/components/ui/Dialog';
import { getTodayOutfits, acceptOutfit, rejectOutfit, regenerateTodayCapsule } from '@/actions/capsule';
import { getTodayContext, updateTodayContext } from '@/actions/context';
import { useCapsuleStore } from '@/store/capsuleStore';

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
  const queryClient = useQueryClient();

  // Server data lives in React Query (cached, refetched on mutation) —
  // seeded with the server-rendered initial data so there's zero load latency.
  const { data } = useQuery({
    queryKey: ['todayOutfits'],
    queryFn: async () => {
      const res = await getTodayOutfits();
      if (!res.success) throw new Error(res.error || 'Failed to load outfits');
      return res.outfits || [];
    },
    initialData: initialOutfits,
  });

  const { data: todayContext } = useQuery({
    queryKey: ['todayContext'],
    queryFn: async () => {
      const res = await getTodayContext();
      return res.success ? res.calendarEvent : '';
    },
    initialData: '',
  });

  const outfits = data || [];

  // Swipe-deck UI state stays local (Zustand) — it's ephemeral and must never
  // wait on a network round trip.
  const { currentIndex, acceptedOutfitId, nextCard, setAcceptedOutfitId, reset } = useCapsuleStore();

  useEffect(() => {
    // If a fresh compile already produced an accepted outfit (rare), reflect it.
    const alreadyAccepted = initialOutfits.find(o => o.status === 'accepted');
    if (alreadyAccepted) setAcceptedOutfitId(alreadyAccepted.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [contextDraft, setContextDraft] = useState('');
  const [editingContext, setEditingContext] = useState(false);

  useEffect(() => {
    setContextDraft(todayContext || '');
  }, [todayContext]);

  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  const activeOutfit = outfits[currentIndex] || null;
  const acceptedOutfit = outfits.find(o => o.id === acceptedOutfitId) || null;

  const acceptMutation = useMutation({
    mutationFn: (outfitId: string) => acceptOutfit(outfitId),
    onSuccess: (res, outfitId) => {
      if (res.success) {
        setAcceptedOutfitId(outfitId);
        triggerConfetti();
        queryClient.invalidateQueries({ queryKey: ['todayOutfits'] });
      }
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ outfitId, reason }: { outfitId: string; reason: string }) => rejectOutfit(outfitId, reason),
    onSuccess: (res) => {
      if (res.success) {
        setRejectOpen(false);
        setRejectReason('');
        setPendingAction(null);
        nextCard();
        queryClient.invalidateQueries({ queryKey: ['todayOutfits'] });
      }
    },
  });

  const contextMutation = useMutation({
    mutationFn: (calendarEvent: string) => updateTodayContext(calendarEvent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayContext'] });
      setEditingContext(false);
    },
  });

  const regenerateMutation = useMutation({
    mutationFn: () => regenerateTodayCapsule(),
    onSuccess: (res) => {
      if (res.success) {
        reset();
        queryClient.invalidateQueries({ queryKey: ['todayOutfits'] });
      }
    },
  });

  const handleAccept = (outfitId: string) => acceptMutation.mutate(outfitId);

  const handleRejectClick = (outfitId: string) => {
    setPendingAction(outfitId);
    setRejectOpen(true);
  };

  const confirmRejection = () => {
    if (!pendingAction) return;
    rejectMutation.mutate({ outfitId: pendingAction, reason: rejectReason });
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
      await controls.start({ x: 500, opacity: 0 });
      handleAccept(activeOutfit.id);
    } else if (info.offset.x < -threshold) {
      await controls.start({ x: -500, opacity: 0 });
      handleRejectClick(activeOutfit.id);
    } else {
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
    <div className="relative w-full min-h-[70vh] flex flex-col items-center justify-center gap-6">
      <canvas ref={confettiCanvasRef} className="fixed inset-0 pointer-events-none z-50 w-full h-full" />

      {/* TODAY'S CONTEXT — the calendar note that actually feeds the reasoning */}
      <div className="w-full max-w-sm">
        {editingContext ? (
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={contextDraft}
              onChange={(e) => setContextDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') contextMutation.mutate(contextDraft);
                if (e.key === 'Escape') setEditingContext(false);
              }}
              placeholder="What's today? e.g. client pitch, gym after work..."
              className="flex-1 text-xs px-3 py-2 rounded-xl bg-card border border-border focus:outline-none focus:border-accent text-foreground placeholder-muted-foreground"
            />
            <Button size="sm" onClick={() => contextMutation.mutate(contextDraft)}>Save</Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditingContext(true)}
              className="flex-1 flex items-center gap-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-3 py-2 rounded-xl border border-dashed border-border/70 hover:border-border min-w-0"
            >
              <CalendarDays size={12} className="flex-shrink-0" />
              <span className="truncate">{todayContext || "Add today's plan (optional) — helps tailor the reasoning"}</span>
            </button>
            <button
              onClick={() => regenerateMutation.mutate()}
              disabled={regenerateMutation.isPending}
              title="Regenerate today's capsule with the latest context"
              className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-xl border border-border bg-card/45 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              <RefreshCw size={12} className={regenerateMutation.isPending ? 'animate-spin' : ''} />
            </button>
          </div>
        )}
      </div>

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

          <Button variant="outline" size="sm" onClick={() => setAcceptedOutfitId(null)} className="w-full">
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => regenerateMutation.mutate()}
            disabled={regenerateMutation.isPending}
            className="w-full flex items-center justify-center gap-2"
          >
            <RefreshCw size={13} className={regenerateMutation.isPending ? 'animate-spin' : ''} />
            Regenerate Today's Capsule
          </Button>
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
            <Button onClick={confirmRejection} disabled={rejectMutation.isPending} className="flex-1">
              Log Rejection
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
