"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { prefersReducedMotion, useInView } from "./hooks";

/** A soft light that follows the pointer across its area. */
export function CursorGlow({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  }
  return (
    <div ref={ref} onPointerMove={onMove} className={cn("group/glow relative", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-500 group-hover/glow:opacity-100"
        style={{
          background:
            "radial-gradient(520px circle at var(--mx, 50%) var(--my, 30%), color-mix(in oklab, var(--glow-amber) 16%, transparent), transparent 60%)",
        }}
      />
      {children}
    </div>
  );
}

/** Card whose border and surface light up where the pointer is. */
export function SpotlightCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--sx", `${e.clientX - r.left}px`);
    el.style.setProperty("--sy", `${e.clientY - r.top}px`);
  }
  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      className={cn(
        "group/spot relative overflow-hidden rounded-[1.75rem] border border-border bg-card/80 p-6 shadow-soft backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:shadow-lift md:p-7",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
        style={{
          background:
            "radial-gradient(380px circle at var(--sx, 50%) var(--sy, 50%), color-mix(in oklab, var(--glow-amber) 13%, transparent), transparent 65%)",
        }}
      />
      <div className="relative">{children}</div>
    </div>
  );
}

/** Cycles through words with a soft blur-and-rise. */
export function RotatingWord({ words, className }: { words: string[]; className?: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const t = setInterval(() => setI((n) => (n + 1) % words.length), 2200);
    return () => clearInterval(t);
  }, [words.length]);
  return (
    <span className={cn("relative inline-grid", className)}>
      {/* Reserve the width of the longest word so the headline never jumps */}
      <span aria-hidden className="invisible col-start-1 row-start-1">
        {words.reduce((a, b) => (b.length > a.length ? b : a))}
      </span>
      <span key={words[i]} className="animate-word col-start-1 row-start-1" aria-live="polite">
        {words[i]}
      </span>
    </span>
  );
}

/** Types text out, pauses, clears, and moves to the next piece. */
export function Typewriter({ texts, className, speed = 34 }: { texts: string[]; className?: string; speed?: number }) {
  const [ref, inView] = useInView<HTMLSpanElement>();
  const [shown, setShown] = useState("");
  useEffect(() => {
    if (!inView) return;
    if (prefersReducedMotion()) {
      const t = setTimeout(() => setShown(texts[0]), 0);
      return () => clearTimeout(t);
    }
    let cancelled = false;
    let t: ReturnType<typeof setTimeout>;
    const run = (idx: number, pos: number) => {
      if (cancelled) return;
      const text = texts[idx];
      if (pos <= text.length) {
        setShown(text.slice(0, pos));
        t = setTimeout(() => run(idx, pos + 1), speed + Math.random() * 40);
      } else {
        t = setTimeout(() => run((idx + 1) % texts.length, 0), 2600);
      }
    };
    run(0, 0);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [inView, texts, speed]);
  return (
    <span ref={ref} className={className}>
      {shown}
      <span className="animate-caret ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[0.15em] bg-saffron" />
    </span>
  );
}

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

/** Shows a sentence turning into ciphertext and back: what "encrypted before it's stored" means. */
export function Scramble({ text, className }: { text: string; className?: string }) {
  const [ref, inView] = useInView<HTMLSpanElement>();
  const [out, setOut] = useState(text);
  useEffect(() => {
    if (!inView || prefersReducedMotion()) return;
    let frame = 0;
    let dir: "encrypt" | "decrypt" = "encrypt";
    let hold = 0;
    const cipher = Array.from(text, (c) => (c === " " ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)]));
    const id = setInterval(() => {
      if (hold > 0) {
        hold--;
        if (dir === "decrypt" && hold % 3 === 0) {
          setOut(cipher.map((c) => (c === " " ? " " : GLYPHS[Math.floor(Math.random() * GLYPHS.length)])).join(""));
        }
        return;
      }
      frame++;
      const n = Math.min(text.length, frame * 2);
      if (dir === "encrypt") {
        setOut(cipher.slice(0, n).join("") + text.slice(n));
        if (n >= text.length) {
          dir = "decrypt";
          frame = 0;
          hold = 30;
        }
      } else {
        setOut(text.slice(0, n) + cipher.slice(n).join(""));
        if (n >= text.length) {
          dir = "encrypt";
          frame = 0;
          hold = 45;
        }
      }
    }, 45);
    return () => clearInterval(id);
  }, [inView, text]);
  return (
    <span ref={ref} className={cn("font-mono break-all", className)}>
      {out}
    </span>
  );
}

/** Counts up to a number when it scrolls into view. */
export function CountUp({ to, className, suffix = "" }: { to: number; className?: string; suffix?: string }) {
  const [ref, inView] = useInView<HTMLSpanElement>();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!inView) return;
    if (prefersReducedMotion()) {
      const t = setTimeout(() => setN(to), 0);
      return () => clearTimeout(t);
    }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 1800);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);
  return (
    <span ref={ref} className={cn("tabular-nums", className)}>
      {n.toLocaleString("en-US")}
      {suffix}
    </span>
  );
}
