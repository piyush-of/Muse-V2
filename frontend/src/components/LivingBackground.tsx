import { useEffect, useRef } from 'react';

interface LivingBackgroundProps {
  isDark: boolean;
}

interface Orb {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  hue: number;
  sat: number;
  alpha: number;
  pulse: number;
  pulseSpeed: number;
}

export default function LivingBackground({ isDark }: LivingBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const orbsRef = useRef<Orb[]>([]);
  const frameRef = useRef<number>(0);
  const isDarkRef = useRef(isDark);

  useEffect(() => {
    isDarkRef.current = isDark;
  }, [isDark]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Palette factory based on mode
    const getOrb = (w: number, h: number): Orb => {
      // Light: warm ecru/violet/taupe tones. Dark: deep purple/charcoal hues
      const lightHues = [30, 270, 50, 290, 20];
      const darkHues = [260, 280, 270, 255, 300];
      const hues = isDarkRef.current ? darkHues : lightHues;
      const hue = hues[Math.floor(Math.random() * hues.length)] + (Math.random() - 0.5) * 30;
      const sat = isDarkRef.current ? 20 + Math.random() * 30 : 15 + Math.random() * 25;

      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        size: 200 + Math.random() * 350,
        hue,
        sat,
        alpha: isDarkRef.current ? 0.04 + Math.random() * 0.06 : 0.06 + Math.random() * 0.08,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.005 + Math.random() * 0.008,
      };
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      // Reinitialise orbs on resize
      orbsRef.current = Array.from({ length: 7 }, () => getOrb(canvas.width, canvas.height));
    };

    resize();
    window.addEventListener('resize', resize);

    // Mouse parallax
    let mx = window.innerWidth / 2;
    let my = window.innerHeight / 2;
    const onMouse = (e: MouseEvent) => { mx = e.clientX; my = e.clientY; };
    window.addEventListener('mousemove', onMouse);

    // Scroll parallax depth
    let scrollY = 0;
    const onScroll = () => { scrollY = window.scrollY; };
    window.addEventListener('scroll', onScroll, { passive: true });

    const tick = () => {
      const w = canvas.width; const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Background fill
      const bgL = isDarkRef.current ? '#131210' : '#F5F2EC';
      ctx.fillStyle = bgL;
      ctx.fillRect(0, 0, w, h);

      const orbs = orbsRef.current;
      orbs.forEach((orb) => {
        // Advance position
        orb.x += orb.vx;
        orb.y += orb.vy;
        orb.pulse += orb.pulseSpeed;

        // Wrap around edges
        if (orb.x < -orb.size) orb.x = w + orb.size;
        if (orb.x > w + orb.size) orb.x = -orb.size;
        if (orb.y < -orb.size) orb.y = h + orb.size;
        if (orb.y > h + orb.size) orb.y = -orb.size;

        // Mouse parallax nudge (subtle)
        const dx = (mx / w - 0.5) * 12;
        const dy = (my / h - 0.5) * 12;
        const scrollOffset = scrollY * 0.035;

        const finalX = orb.x + dx;
        const finalY = orb.y + dy + scrollOffset;
        const pulsedSize = orb.size * (1 + Math.sin(orb.pulse) * 0.12);
        const pulsedAlpha = orb.alpha * (1 + Math.sin(orb.pulse * 0.7) * 0.2);

        const lightness = isDarkRef.current ? '15%' : '90%';
        const grad = ctx.createRadialGradient(finalX, finalY, 0, finalX, finalY, pulsedSize);
        grad.addColorStop(0, `hsla(${orb.hue}, ${orb.sat}%, ${lightness}, ${pulsedAlpha})`);
        grad.addColorStop(1, `hsla(${orb.hue}, ${orb.sat}%, ${lightness}, 0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(finalX, finalY, pulsedSize, 0, Math.PI * 2);
        ctx.fill();
      });

      // Subtle vignette
      const vign = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h);
      if (isDarkRef.current) {
        vign.addColorStop(0, 'rgba(0,0,0,0)');
        vign.addColorStop(1, 'rgba(0,0,0,0.45)');
      } else {
        vign.addColorStop(0, 'rgba(245,242,236,0)');
        vign.addColorStop(1, 'rgba(200,190,175,0.25)');
      }
      ctx.fillStyle = vign;
      ctx.fillRect(0, 0, w, h);

      frameRef.current = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouse);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="living-bg"
      aria-hidden="true"
    />
  );
}
