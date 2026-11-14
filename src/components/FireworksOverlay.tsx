import React, { useEffect, useRef } from 'react';
import { audioEngine } from '../utils/audioEngine';

interface FireworksOverlayProps {
  active: boolean;
  burstTrigger?: number;
}

interface Rocket {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetY: number;
  color: string;
  trail: { x: number; y: number }[];
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  decay: number;
  size: number;
  isStar: boolean;
  rotation: number;
  spin: number;
}

const PALETTE = [
  '#F59E0B', // Gold
  '#2563EB', // Sky Blue
  '#10B981', // Emerald
  '#EC4899', // Pink
  '#8B5CF6', // Violet
  '#EF4444', // Coral Red
  '#06B6D4', // Cyan
];

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  rotation: number
) {
  const innerR = outerR * 0.45;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotation);
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export const FireworksOverlay: React.FC<FireworksOverlayProps> = ({ active, burstTrigger = 0 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!active) return;
    if (typeof window === 'undefined') return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const rockets: Rocket[] = [];
    const sparks: Spark[] = [];

    const launchRocket = (xRatio?: number) => {
      const x = (xRatio ?? (0.15 + Math.random() * 0.7)) * width;
      const targetY = (0.14 + Math.random() * 0.34) * height;
      const color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      rockets.push({
        x,
        y: height + 10,
        vx: (Math.random() - 0.5) * 2.2,
        vy: -(11 + Math.random() * 4.5),
        targetY,
        color,
        trail: [],
      });
    };

    const explode = (x: number, y: number, primaryColor: string) => {
      audioEngine.playFireworkPop();
      const count = 44 + Math.floor(Math.random() * 20);
      const secondaryColor = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.18;
        const speed = 2.2 + Math.random() * 5.8;
        const useStar = i % 5 === 0;
        sparks.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: i % 3 === 0 ? secondaryColor : i % 4 === 0 ? '#FDE047' : primaryColor,
          alpha: 1,
          decay: 0.011 + Math.random() * 0.01,
          size: useStar ? 5.5 + Math.random() * 3 : 2.4 + Math.random() * 2.4,
          isStar: useStar,
          rotation: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.16,
        });
      }
    };

    // Staggered grand finale firework salvos over ~4.2 seconds
    const scheduledTimers: number[] = [];
    const launchSchedule = [
      { delay: 40, x: 0.25 },
      { delay: 160, x: 0.75 },
      { delay: 320, x: 0.5 },
      { delay: 750, x: 0.2 },
      { delay: 900, x: 0.8 },
      { delay: 1150, x: 0.42 },
      { delay: 1450, x: 0.62 },
      { delay: 1950, x: 0.3 },
      { delay: 2150, x: 0.72 },
      { delay: 2550, x: 0.5 },
      { delay: 3050, x: 0.22 },
      { delay: 3250, x: 0.78 },
      { delay: 3650, x: 0.48 },
    ];

    launchSchedule.forEach((item) => {
      const t = window.setTimeout(() => launchRocket(item.x), item.delay);
      scheduledTimers.push(t);
    });

    const tick = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.trail.push({ x: r.x, y: r.y });
        if (r.trail.length > 8) r.trail.shift();

        r.x += r.vx;
        r.y += r.vy;
        r.vy += 0.14;

        // Draw glowing rocket trail
        for (let t = 0; t < r.trail.length; t++) {
          const pt = r.trail[t];
          ctx.globalAlpha = ((t + 1) / r.trail.length) * 0.75;
          ctx.fillStyle = r.color;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(r.x, r.y, 3.2, 0, Math.PI * 2);
        ctx.fill();

        if (r.y <= r.targetY || r.vy >= -1.2) {
          explode(r.x, r.y, r.color);
          rockets.splice(i, 1);
        }
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vx *= 0.965;
        s.vy = s.vy * 0.965 + 0.085;
        s.alpha -= s.decay;
        s.rotation += s.spin;

        if (s.alpha <= 0.02) {
          sparks.splice(i, 1);
          continue;
        }

        ctx.globalAlpha = Math.max(0, s.alpha);
        ctx.fillStyle = s.color;
        if (s.isStar) {
          drawStar(ctx, s.x, s.y, s.size, s.rotation);
        } else {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.globalAlpha = 1;

      if (rockets.length > 0 || sparks.length > 0 || scheduledTimers.length > 0) {
        animId = window.requestAnimationFrame(tick);
      }
    };

    animId = window.requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', resize);
      window.cancelAnimationFrame(animId);
      scheduledTimers.forEach((t) => window.clearTimeout(t));
    };
  }, [active, burstTrigger]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-40"
    />
  );
};
