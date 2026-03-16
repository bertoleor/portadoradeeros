"use client";

import React, { useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// CONFIGURACIÓN — ajustar aquí sin tocar el resto del componente
// ---------------------------------------------------------------------------

// Parejas de colores que conviven. Se muestran de a una por vez
// con crossfade suave entre ellas.
const COLOR_PAIRS: Array<[RGB, RGB]> = [
  [{ r: 152, g: 251, b: 152 }, { r: 255, g: 235, b: 153 }], // menta + amarillo
  [{ r: 135, g: 206, b: 250 }, { r: 216, g: 180, b: 226 }], // celeste + violeta
  [{ r: 255, g: 182, b: 193 }, { r: 255, g: 200, b: 162 }], // rosa + naranja
  [{ r: 176, g: 196, b: 255 }, { r: 152, g: 251, b: 152 }], // azul periwinkle + menta
];

const FRAMES_PER_PAIR = 420; // frames que dura cada par (~7s a 60fps). Subir = más lento
const FADE_FRAMES     = 90;  // frames del crossfade entre pares (~1.5s). Bajar = corte más abrupto
const PARTICLE_SPEED  = 0.55; // velocidad de movimiento. 0 = estático, 1 = rápido
const BREATH_AMOUNT   = 0.12; // cuánto pulsa el tamaño (0 = sin respiración, 0.2 = mucho)
const BREATH_SPEED    = 0.003; // velocidad del pulso
const BASE_OPACITY    = 0.55; // opacidad máxima en el centro del gradiente
const VEIL_OPACITY    = 0.20; // velo final que suaviza la mezcla (más alto = más blanco)
const BG_COLOR        = "#f8f9fb"; // color base del canvas

// ---------------------------------------------------------------------------

interface RGB { r: number; g: number; b: number }

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseSize: number;
  size: number;
  color: RGB;
  tick: number;
}

function createParticle(
  width: number,
  height: number,
  color: RGB,
  speed: number
): Particle {
  const baseSize =
    Math.max(width * 0.55, 500) + Math.random() * width * 0.35;
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * speed,
    vy: (Math.random() - 0.5) * speed,
    baseSize,
    size: baseSize,
    color,
    tick: Math.random() * 100,
  };
}

/**
 * Calcula cuánta opacidad tiene cada par en el frame actual.
 * Solo 1 par (o 2 durante el crossfade) están visibles a la vez.
 */
function getPairOpacities(globalTick: number, pairCount: number): number[] {
  const totalCycle = FRAMES_PER_PAIR * pairCount;
  const t = globalTick % totalCycle;
  const opacities = new Array<number>(pairCount).fill(0);

  for (let i = 0; i < pairCount; i++) {
    const start = i * FRAMES_PER_PAIR;
    const local = t - start;
    if (local < 0 || local >= FRAMES_PER_PAIR) continue;

    let alpha: number;
    if (local < FADE_FRAMES) {
      alpha = local / FADE_FRAMES;
    } else if (local > FRAMES_PER_PAIR - FADE_FRAMES) {
      alpha = (FRAMES_PER_PAIR - local) / FADE_FRAMES;
    } else {
      alpha = 1;
    }
    opacities[i] = alpha;
  }

  // Solapamiento circular: el último par hace crossfade con el primero
  const lastStart = (pairCount - 1) * FRAMES_PER_PAIR;
  const lastLocal = t - lastStart;
  if (lastLocal > FRAMES_PER_PAIR - FADE_FRAMES) {
    const bleed = (lastLocal - (FRAMES_PER_PAIR - FADE_FRAMES)) / FADE_FRAMES;
    opacities[0] = Math.max(opacities[0], bleed);
  }

  return opacities;
}

export default function BackgroundMesh(): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const speed = reducedMotion ? 0 : PARTICLE_SPEED;

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let globalTick = 0;
    let rafId = 0;
    let resizeTimeout: ReturnType<typeof setTimeout>;

    function init() {
      width  = canvas!.width  = window.innerWidth;
      height = canvas!.height = window.innerHeight;
      // 2 partículas por par (una por cada color)
      particles = COLOR_PAIRS.flatMap((pair) =>
        pair.map((color) => createParticle(width, height, color, speed))
      );
    }

    function draw() {
      // Fondo base
      ctx!.fillStyle = BG_COLOR;
      ctx!.fillRect(0, 0, width, height);

      globalTick++;
      const opacities = getPairOpacities(globalTick, COLOR_PAIRS.length);

      COLOR_PAIRS.forEach((pair, pairIndex) => {
        const pairAlpha = opacities[pairIndex];
        if (pairAlpha < 0.01) return; // par invisible, skip

        pair.forEach((color, colorIndex) => {
          const p = particles[pairIndex * 2 + colorIndex];

          // Respiración
          p.tick += BREATH_SPEED;
          p.size = p.baseSize + Math.sin(p.tick) * p.baseSize * BREATH_AMOUNT;

          // Movimiento con wrap en bordes
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < -p.size) p.x = width  + p.size;
          if (p.x > width  + p.size) p.x = -p.size;
          if (p.y < -p.size) p.y = height + p.size;
          if (p.y > height + p.size) p.y = -p.size;

          // Gradiente radial modulado por la opacidad del par
          const grad = ctx!.createRadialGradient(
            p.x, p.y, 0,
            p.x, p.y, p.size
          );
          const { r, g, b } = color;
          grad.addColorStop(0,    `rgba(${r},${g},${b},${BASE_OPACITY * pairAlpha})`);
          grad.addColorStop(0.50, `rgba(${r},${g},${b},${0.20 * pairAlpha})`);
          grad.addColorStop(1,    `rgba(${r},${g},${b},0)`);

          ctx!.beginPath();
          ctx!.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx!.fillStyle = grad;
          ctx!.fill();
        });
      });

      // Velo final — suaviza y evita saturación
      ctx!.fillStyle = `rgba(248,249,251,${VEIL_OPACITY})`;
      ctx!.fillRect(0, 0, width, height);

      rafId = requestAnimationFrame(draw);
    }

    function handleResize() {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(init, 200);
    }

    window.addEventListener("resize", handleResize);
    init();
    draw();

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(resizeTimeout);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10 pointer-events-none"
      aria-hidden="true"
    />
  );
}
