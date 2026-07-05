"use client";

import { useEffect, useRef } from "react";

// The landing hero motif (section 6.1): a slow, generative point field that
// reads as archival dust, or a scatter of comps settling. Implemented in Canvas
// 2D rather than WebGL/react-three-fiber: the visual intent needs no 3D, and a
// 2D field carries no heavy dependency and no build risk. Frame-rate capped.
// Under prefers-reduced-motion it draws a single static frame. If the canvas is
// unavailable it renders nothing and the grain overlay carries the texture, so
// the hero always has a background.
//
// Colors are the design tokens, hard-coded here because canvas cannot read CSS
// custom properties: bone dust with an occasional oxblood mote.
const BONE = "232,227,214";
const BLOOD = "168,48,46";

export function HeroMotif() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let width = 0;
    let height = 0;
    let raf = 0;
    let last = 0;
    const FRAME_MS = 1000 / 30; // cap at ~30fps

    type P = { x: number; y: number; vx: number; vy: number; r: number; a: number; blood: boolean };
    let points: P[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const seed = () => {
      const n = Math.round(Math.min(120, Math.max(40, width / 12)));
      points = Array.from({ length: n }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.5) * 0.08,
        r: Math.random() * 1.3 + 0.3,
        a: Math.random() * 0.35 + 0.08,
        blood: Math.random() < 0.06,
      }));
    };

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      for (const p of points) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.blood ? BLOOD : BONE},${p.a})`;
        ctx.fill();
      }
    };

    const step = (now: number) => {
      if (now - last >= FRAME_MS) {
        last = now;
        for (const p of points) {
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -2) p.x = width + 2;
          else if (p.x > width + 2) p.x = -2;
          if (p.y < -2) p.y = height + 2;
          else if (p.y > height + 2) p.y = -2;
        }
        draw();
      }
      raf = requestAnimationFrame(step);
    };

    resize();
    seed();
    draw();
    if (!reduce) raf = requestAnimationFrame(step);

    const onResize = () => {
      resize();
      seed();
      draw();
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="hero-motif" aria-hidden="true" />;
}
