"use client";

import { Download, FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { prefersReducedMotion } from "./hooks";

const START = 2026;
const YEARS = 30;
const WEEKS = 52;
const TOTAL = YEARS * WEEKS;

const MILESTONES = [
  { year: 2026, title: "Today", text: "Started keeping everything in one place. First entry: what I learned this week." },
  { year: 2031, title: "First home", text: "The keys felt heavier than I expected. Mom cried more than I did." },
  { year: 2036, title: "A new city", text: "Everything unfamiliar. Wrote every night so I wouldn't forget who I was." },
  { year: 2041, title: "Their first words", text: "She said 'moon' pointing at the sky. I wrote it down the same minute." },
  { year: 2046, title: "Twenty years of notes", text: "Searched 'fear' and read how I got through every hard year. I'm braver than I thought." },
  { year: 2051, title: "Still learning", text: "Took up the cello at last. Lesson one: patience. Lesson two: more patience." },
  { year: 2056, title: "Look back", text: "Thirty years, one place. My children read my first entry today." },
];

// Deterministic "memory weeks" so the pattern is the same on every visit.
function isMemoryWeek(i: number) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x) < 0.16;
}

/**
 * A lifetime in weeks. The section pins while you scroll through it: the
 * year counts up, a grid of 1,560 weeks fills in, and memories surface along the way.
 */
export function LifetimeScroll() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [progress, setProgress] = useState(0);

  // Scroll progress through the pinned section, 0 → 1.
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      const t = setTimeout(() => setProgress(1), 0);
      return () => clearTimeout(t);
    }
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 1;
      setProgress(p);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Draw the weeks grid on a canvas: 1,560 cells stays smooth at 60fps.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const cell = w / WEEKS;
    const h = cell * YEARS;
    if (canvas.width !== Math.round(w * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.height = `${h}px`;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const filled = Math.round(progress * TOTAL);
    const dark = document.documentElement.classList.contains("dark");
    const r = Math.max(1.2, cell * 0.28);
    for (let i = 0; i < TOTAL; i++) {
      const x = (i % WEEKS) * cell + cell / 2;
      const y = Math.floor(i / WEEKS) * cell + cell / 2;
      const on = i < filled;
      const memory = on && isMemoryWeek(i);
      ctx.beginPath();
      ctx.arc(x, y, memory ? r * 1.25 : r, 0, Math.PI * 2);
      if (memory) {
        ctx.shadowColor = "rgba(255,159,67,0.9)";
        ctx.shadowBlur = 8;
        ctx.fillStyle = "#ff9f43";
      } else {
        ctx.shadowBlur = 0;
        ctx.fillStyle = on
          ? dark
            ? "rgba(122,146,255,0.75)"
            : "rgba(61,90,254,0.55)"
          : dark
            ? "rgba(255,255,255,0.07)"
            : "rgba(15,20,38,0.08)";
      }
      ctx.fill();
    }
    ctx.shadowBlur = 0;
  }, [progress]);

  const year = START + Math.round(progress * YEARS);
  const filledWeeks = Math.round(progress * TOTAL);
  const memories = Array.from({ length: filledWeeks }, (_, i) => i).filter(isMemoryWeek).length;
  const active = Math.min(MILESTONES.length - 1, Math.round(progress * (MILESTONES.length - 1)));
  const done = progress > 0.97;

  return (
    <section ref={sectionRef} className="relative h-[320vh] border-y border-border bg-card/40">
      <div className="sticky top-0 flex h-dvh items-center overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 transition-opacity duration-700"
          style={{
            opacity: 0.35 + progress * 0.5,
            background: `radial-gradient(60rem 30rem at ${20 + progress * 60}% 80%, color-mix(in oklab, var(--glow-amber) 16%, transparent), transparent 70%)`,
          }}
        />
        <div className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-5 pt-16 md:grid-cols-[1fr_1.15fr] md:px-8">
          {/* Left: the story */}
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.18em] text-saffron uppercase">
              <span className="h-px w-6 bg-saffron/70" />
              Built for the next 30 years
            </p>
            <p className="mt-5 font-serif text-[5.5rem] leading-none tracking-[-0.04em] tabular-nums md:text-[8rem]">{year}</p>
            <p className="mt-3 text-muted-foreground">
              <span className="font-medium text-foreground tabular-nums">{filledWeeks.toLocaleString("en-US")}</span> weeks lived ·{" "}
              <span className="font-medium text-saffron tabular-nums">{memories.toLocaleString("en-US")}</span> kept as memories
            </p>

            <div className="relative mt-8 h-40">
              {MILESTONES.map((m, i) => (
                <article
                  key={m.year}
                  aria-hidden={i !== active}
                  className={cn(
                    "absolute inset-0 rounded-2xl border border-border bg-background/80 p-5 shadow-lift backdrop-blur transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    i === active ? "translate-y-0 opacity-100" : i < active ? "-translate-y-4 opacity-0" : "translate-y-4 opacity-0",
                  )}
                >
                  <p className="text-xs font-semibold text-saffron">
                    {m.year} · {m.title}
                  </p>
                  <p className="mt-2 font-writing text-lg leading-snug">{m.text}</p>
                </article>
              ))}
            </div>

            <div
              className={cn(
                "mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground transition-all duration-700",
                done ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
              )}
            >
              <span className="font-medium text-foreground">Even if Yaadasht disappears, your memories don&apos;t.</span>
              <span className="flex items-center gap-1.5">
                <FileText className="size-4 text-saffron" /> Open formats
              </span>
              <span className="flex items-center gap-1.5">
                <Download className="size-4 text-saffron" /> Export anytime
              </span>
            </div>
          </div>

          {/* Right: a life in weeks */}
          <div>
            <div className="rounded-[1.75rem] border border-border bg-background/60 p-4 shadow-soft backdrop-blur md:p-6">
              <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>Your next 30 years, one dot per week</span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-saffron shadow-[0_0_8px_var(--glow-amber)]" /> a memory kept
                </span>
              </div>
              <canvas ref={canvasRef} className="block w-full" aria-label="A grid of 1,560 weeks filling in as you scroll" role="img" />
            </div>
            {/* the years */}
            <div className="relative mt-6">
              <div className="absolute top-[0.45rem] right-0 left-0 h-px bg-border" />
              <div
                className="absolute top-[0.45rem] left-0 h-px bg-gradient-to-r from-electric to-saffron"
                style={{ width: `${progress * 100}%` }}
              />
              <ol className="relative flex justify-between">
                {MILESTONES.map((m, i) => {
                  const lit = progress >= i / (MILESTONES.length - 1) - 0.001;
                  return (
                    <li key={m.year} className="flex flex-col items-center">
                      <span
                        className={cn(
                          "size-[0.9rem] rounded-full border-2 border-border bg-background transition-all duration-300",
                          lit && "scale-110 border-saffron bg-saffron shadow-[0_0_14px_var(--glow-amber)]",
                        )}
                      />
                      <span className={cn("mt-2 text-xs tabular-nums transition-colors", lit ? "font-semibold text-foreground" : "text-muted-foreground")}>
                        {m.year}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
