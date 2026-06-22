import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useStore } from '../store/useStore';
import { Check, X, Info, Sparkles, RefreshCw, AlertCircle } from 'lucide-react';

interface Garment {
  id: number;
  photoUrl: string;
  category: string;
  color: string;
  season: string;
  formality: string;
}

interface Outfit {
  id: number;
  date: string;
  itemIds: number[];
  reasoning: string;
  status: 'pending' | 'accepted' | 'rejected';
  rejectionReason?: string;
  garments: Garment[];
}

export default function DailyCapsule() {
  const token = useStore((state) => state.token);
  const queryClient = useQueryClient();
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [acceptedOutfit, setAcceptedOutfit] = useState<Outfit | null>(null);
  const [swipeOffset, setSwipeOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Check user motion preferences
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api';

  // React Query: Fetch today's cached capsule outfits
  const { data: outfits = [], isLoading, error } = useQuery<Outfit[]>({
    queryKey: ['todayCapsule'],
    queryFn: async () => {
      const res = await fetch(`${apiBase}/capsule/today`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch capsule");
      return res.json();
    },
    enabled: !!token
  });

  // Query state sync
  useEffect(() => {
    if (outfits.length > 0) {
      const alreadyAccepted = outfits.find(o => o.status === 'accepted');
      if (alreadyAccepted) {
        setAcceptedOutfit(alreadyAccepted);
      } else {
        // Find first pending outfit index
        const pendingIdx = outfits.findIndex(o => o.status === 'pending');
        setCurrentIndex(pendingIdx !== -1 ? pendingIdx : outfits.length);
      }
    }
  }, [outfits]);

  // Mutations: Accept outfit look
  const acceptMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${apiBase}/capsule/${id}/accept`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to accept outfit");
      return res.json();
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['todayCapsule'] });
      queryClient.invalidateQueries({ queryKey: ['profileStyle'] });
      const outfit = outfits.find(o => o.id === id);
      if (outfit) {
        setAcceptedOutfit(outfit);
        if (!prefersReducedMotion) triggerConfetti();
      }
    }
  });

  // Mutations: Reject outfit look
  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) => {
      const res = await fetch(`${apiBase}/capsule/${id}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      if (!res.ok) throw new Error("Failed to reject outfit");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayCapsule'] });
      setCurrentIndex(prev => prev + 1);
      setSwipeOffset({ x: 0, y: 0 });
      setSwipeDirection(null);
      setRejectionReason('');
      setShowRejectModal(false);
    }
  });

  // Local Confetti burst canvas particles
  const triggerConfetti = () => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles: any[] = [];
    const colors = ['#4B3B66', '#EAE5F0', '#352849', '#FAF9F5', '#A39C8E'];

    for (let i = 0; i < 100; i++) {
      particles.push({
        x: canvas.width / 2,
        y: canvas.height / 2 - 100,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.7) * 12 - 4,
        radius: Math.random() * 3.5 + 1.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        decay: Math.random() * 0.015 + 0.008,
        gravity: 0.22
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = false;

      particles.forEach((p) => {
        if (p.alpha <= 0) return;
        alive = true;

        p.x += p.vx;
        p.y += p.vy;
        p.vy += p.gravity;
        p.alpha -= p.decay;

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      if (alive) {
        animFrameIdRef.current = requestAnimationFrame(animate);
      }
    };

    if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    animate();
  };

  useEffect(() => {
    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (currentIndex >= outfits.length) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    if (cardRef.current) {
      cardRef.current.style.transition = 'none';
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || currentIndex >= outfits.length) return;
    const deltaX = e.clientX - dragStart.current.x;
    const deltaY = e.clientY - dragStart.current.y;
    setSwipeOffset({ x: deltaX, y: deltaY });

    if (deltaX > 60) {
      setSwipeDirection('right');
    } else if (deltaX < -60) {
      setSwipeDirection('left');
    } else {
      setSwipeDirection(null);
    }
  };

  const handlePointerUp = () => {
    if (!isDragging || currentIndex >= outfits.length) return;
    setIsDragging(false);

    const threshold = 120;
    if (swipeOffset.x > threshold) {
      completeSwipe('right');
    } else if (swipeOffset.x < -threshold) {
      // Rejection triggers modal to capture reason
      setShowRejectModal(true);
    } else {
      if (cardRef.current) {
        cardRef.current.style.transition = prefersReducedMotion 
          ? 'none' 
          : 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.15)';
      }
      setSwipeOffset({ x: 0, y: 0 });
      setSwipeDirection(null);
    }
  };

  const completeSwipe = (direction: 'left' | 'right') => {
    const activeOutfit = outfits[currentIndex];
    if (!activeOutfit) return;

    if (direction === 'right') {
      acceptMutation.mutate(activeOutfit.id);
    } else {
      rejectMutation.mutate({ id: activeOutfit.id, reason: rejectionReason });
    }
  };

  const handleManualAccept = () => {
    const activeOutfit = outfits[currentIndex];
    if (activeOutfit) acceptMutation.mutate(activeOutfit.id);
  };

  const handleManualReject = () => {
    setShowRejectModal(true);
  };

  const resetTodayCapsule = async () => {
    try {
      // Fetch new stubs or recreate
      await fetch(`${apiBase}/capsule/today`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setAcceptedOutfit(null);
      setCurrentIndex(0);
      queryClient.invalidateQueries({ queryKey: ['todayCapsule'] });
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin mb-4" />
        <p className="text-ink-secondary text-sm">Calibrating look capsule...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 bg-red-50 border border-red-100 rounded-xl max-w-md mx-auto mt-10">
        <AlertCircle className="mx-auto text-red-600 mb-3" size={24} />
        <h3 className="font-serif text-lg text-red-800 mb-2">Failed to load Capsule</h3>
        <p className="text-red-600 text-xs">{error.message || 'Make sure the server and database are running.'}</p>
      </div>
    );
  }

  const activeOutfit = outfits[currentIndex];
  const isFinished = currentIndex >= outfits.length;

  return (
    <div className="relative w-full">
      <canvas ref={confettiCanvasRef} className="fixed top-0 left-0 w-full h-full pointer-events-none z-[1000]" />

      <div className="text-center mb-10">
        <h2 className="font-serif text-4xl text-ink-primary mb-3">
          {acceptedOutfit ? 'Look Capsule Set' : "Today's Capsule"}
        </h2>
        <p className="text-ink-secondary text-sm max-w-md mx-auto">
          {acceptedOutfit 
            ? 'Suggestion accepted. Decision compressed in 3 seconds.' 
            : 'MUSE has generated three daily outfit proposals. Swipe to accept or skip.'}
        </p>
      </div>

      {!acceptedOutfit && !isFinished && activeOutfit ? (
        <div className="flex flex-col items-center">
          
          {/* Deck card container */}
          <div className="swipe-deck-container mb-10">
            {outfits.map((outfit, index) => {
              if (index < currentIndex || index > currentIndex + 1) return null;
              const isTop = index === currentIndex;

              let cardStyle: React.CSSProperties = {};
              
              if (isTop) {
                const rotation = prefersReducedMotion ? 0 : swipeOffset.x * 0.04;
                cardStyle = {
                  transform: `translate(${swipeOffset.x}px, ${swipeOffset.y}px) rotate(${rotation}deg)`,
                  zIndex: 10,
                  opacity: 1
                };
              } else {
                const scale = prefersReducedMotion ? 1 : 0.95 + (Math.min(Math.abs(swipeOffset.x), 200) / 200) * 0.05;
                const translateY = prefersReducedMotion ? 0 : 12 - (Math.min(Math.abs(swipeOffset.x), 200) / 200) * 12;
                cardStyle = {
                  transform: `scale(${scale}) translateY(${translateY}px)`,
                  zIndex: 5,
                  opacity: 0.6 + (Math.min(Math.abs(swipeOffset.x), 200) / 200) * 0.4,
                  pointerEvents: 'none'
                };
              }

              return (
                <div
                  key={outfit.id}
                  ref={isTop ? cardRef : null}
                  className="swipe-card bg-cardSurface border border-borderHairline p-6 flex flex-col justify-between shadow-md rounded-xl"
                  style={cardStyle}
                  onPointerDown={isTop ? handlePointerDown : undefined}
                  onPointerMove={isTop ? handlePointerMove : undefined}
                  onPointerUp={isTop ? handlePointerUp : undefined}
                  onPointerCancel={isTop ? handlePointerUp : undefined}
                >
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-[10px] uppercase tracking-wider font-semibold text-ink-tertiary">
                        Look {index + 1} of {outfits.length}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 border border-borderHairline bg-paper text-ink-secondary rounded-full">
                        Pending Selection
                      </span>
                    </div>

                    <h3 className="font-serif text-2xl text-ink-primary mb-6">
                      Look Option {index + 1}
                    </h3>

                    {/* Clothing Garments List */}
                    <div className="space-y-4">
                      {outfit.garments.length > 0 ? (
                        outfit.garments.map((g, gIdx) => (
                          <div key={gIdx} className="flex items-center justify-between pb-3 border-b border-dashed border-borderHairline">
                            <div className="flex items-center gap-3">
                              {g.photoUrl ? (
                                <img 
                                  src={g.photoUrl.startsWith('/') ? `${apiBase.replace('/api', '')}${g.photoUrl}` : g.photoUrl} 
                                  alt={g.category}
                                  className="w-10 h-10 object-cover rounded border border-borderHairline"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-paper border border-borderHairline rounded flex items-center justify-center text-[10px] text-ink-tertiary">
                                  No Img
                                </div>
                              )}
                              <div>
                                <div className="text-xs font-semibold text-ink-primary capitalize">{g.category}</div>
                                <div className="text-[10px] text-ink-secondary capitalize">{g.formality} • {g.season}</div>
                              </div>
                            </div>
                            <div 
                              className="w-4 h-4 rounded-full border border-borderHairline" 
                              style={{ backgroundColor: g.color }}
                              title={g.color}
                            />
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-ink-tertiary py-4 text-center">
                          No garments associated. Open Closet to upload photos first.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Swipe Overlay Banner */}
                  {isTop && swipeDirection && (
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-12 px-6 py-3 border-4 font-bold text-2xl tracking-widest rounded-lg z-50 bg-cardSurface/95 ${
                      swipeDirection === 'right' ? 'border-emerald-600 text-emerald-600' : 'border-red-600 text-red-600'
                    }`}>
                      {swipeDirection === 'right' ? 'ACCEPT' : 'SKIP'}
                    </div>
                  )}

                  {/* Acceptance probabilities */}
                  <div className="flex items-start gap-2 pt-4 border-t border-borderHairline">
                    <Info size={14} className="text-accent mt-0.5 flex-shrink-0" />
                    <span className="text-[10px] text-ink-secondary leading-normal">
                      Acceptance rate probability: 88%. Picked to rotate clothing wear frequency.
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Swipe Buttons */}
          <div className="flex gap-6 mb-10">
            <button
              onClick={handleManualReject}
              className="w-14 h-14 rounded-full bg-cardSurface border border-borderHairline text-ink-secondary hover:text-red-700 hover:border-red-300 flex items-center justify-center transition-all shadow-sm"
              title="Skip Outfit"
            >
              <X size={20} />
            </button>
            <button
              onClick={handleManualAccept}
              className="w-14 h-14 rounded-full bg-accent text-white hover:bg-accent-text flex items-center justify-center transition-all shadow-md"
              title="Accept Outfit"
            >
              <Check size={20} />
            </button>
          </div>

          {/* Reasoning Alert Box */}
          <div className="w-full max-w-md bg-accent-soft/30 border border-accent/15 p-5 rounded-lg flex items-start gap-3">
            <Sparkles size={16} className="text-accent mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-[10px] font-bold text-accent uppercase tracking-wider mb-1">
                Styling Rationale
              </div>
              <p className="text-xs text-ink-primary leading-relaxed">
                {activeOutfit.reasoning}
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Accepted Outfit Summary or Empty suggests */
        <div className="max-w-md mx-auto bg-cardSurface border border-borderHairline p-8 text-center rounded-xl shadow-md">
          {acceptedOutfit ? (
            <div>
              <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-6">
                <Check size={24} />
              </div>
              <h3 className="font-serif text-2xl text-ink-primary mb-2">Look Confirmed</h3>
              <p className="text-ink-secondary text-xs mb-6">
                Outfit locked. We have registered wear events for these garments.
              </p>

              <div className="bg-paper/40 border border-borderHairline rounded-lg p-5 text-left space-y-3 mb-6">
                <div className="text-[9px] uppercase tracking-wider font-semibold text-ink-tertiary mb-1">Locked Closet Items</div>
                {acceptedOutfit.garments.map((g, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs">
                    <div className="w-6 h-6 rounded-full border border-borderHairline" style={{ backgroundColor: g.color }} />
                    <span className="font-semibold text-ink-primary capitalize">{g.category}</span>
                    <span className="text-ink-tertiary">({g.formality} • {g.season})</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <h3 className="font-serif text-2xl text-ink-primary mb-3">Capsule Complete</h3>
              <p className="text-ink-secondary text-xs mb-6">
                You have skipped all three outfit proposals for today. Add more garments to Closet or reset looks.
              </p>
            </div>
          )}

          <button 
            onClick={resetTodayCapsule}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-text text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
          >
            <RefreshCw size={13} />
            <span>Recalibrate look set</span>
          </button>
        </div>
      )}

      {/* REJECTION MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-paper/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-cardSurface border border-borderHairline p-6 max-w-sm w-full rounded-xl shadow-lg">
            <h4 className="font-serif text-xl text-ink-primary mb-2">Why skip this outfit?</h4>
            <p className="text-ink-secondary text-[11px] mb-4">
              Your feedback is treated as first-class training data to compress future outfit choices.
            </p>
            
            <textarea
              required
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Color mismatch, too formal, or fabric is too warm..."
              className="w-full p-3 bg-paper border border-borderHairline rounded-lg text-xs text-ink-primary placeholder-ink-tertiary focus:outline-none focus:border-accent resize-none mb-4 font-sans"
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                className="px-4 py-2 border border-borderHairline text-ink-secondary hover:text-ink-primary text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const activeOutfit = outfits[currentIndex];
                  if (activeOutfit) {
                    rejectMutation.mutate({ id: activeOutfit.id, reason: rejectionReason });
                  }
                }}
                className="px-4 py-2 bg-accent hover:bg-accent-text text-white text-xs font-semibold rounded-lg"
              >
                Log skip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
