"use client";

import { useEffect, useRef } from "react";
import { LogoArt } from "@/components/brand/logo";
import { prefersReducedMotion } from "./hooks";

const SPARKS = [
  { left: "38%", top: "34%", delay: "0s", size: 5 },
  { left: "46%", top: "28%", delay: "1.1s", size: 4 },
  { left: "54%", top: "31%", delay: "2.3s", size: 6 },
  { left: "42%", top: "40%", delay: "3.2s", size: 3 },
  { left: "59%", top: "37%", delay: "0.6s", size: 4 },
  { left: "50%", top: "24%", delay: "4.1s", size: 5 },
  { left: "35%", top: "45%", delay: "2.8s", size: 3 },
];

/**
 * The logo as a living object: it tilts toward the pointer, memories ripple
 * outward from it, and sparks of light rise from the mind.
 */
export function LogoOrb() {
  const stageRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current?.closest(".orbit-stage") as HTMLElement | null;
    const tilt = tiltRef.current;
    if (!stage || !tilt || prefersReducedMotion()) return;

    let raf = 0;
    let target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };

    const loop = () => {
      // Ease toward the pointer for a smooth, weighty feel.
      current.x += (target.x - current.x) * 0.08;
      current.y += (target.y - current.y) * 0.08;
      tilt.style.setProperty("--rx", `${(-current.y * 12).toFixed(2)}deg`);
      tilt.style.setProperty("--ry", `${(current.x * 14).toFixed(2)}deg`);
      tilt.style.setProperty("--gx", `${(50 + current.x * 25).toFixed(1)}%`);
      tilt.style.setProperty("--gy", `${(50 + current.y * 25).toFixed(1)}%`);
      raf = requestAnimationFrame(loop);
    };
    const onMove = (e: PointerEvent) => {
      const r = stage.getBoundingClientRect();
      target = { x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 };
    };
    const onLeave = () => {
      target = { x: 0, y: 0 };
    };

    raf = requestAnimationFrame(loop);
    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div ref={stageRef} className="absolute inset-0">
      {/* breathing glow */}
      <div
        aria-hidden
        className="animate-glow absolute inset-[18%] rounded-full bg-[radial-gradient(closest-side,rgba(255,159,67,0.55),rgba(61,90,254,0.25)_55%,transparent)] blur-2xl"
      />

      {/* memories rippling outward */}
      {[0, 1.6, 3.2].map((d) => (
        <span
          key={d}
          aria-hidden
          className="logo-ripple absolute inset-[23%] rounded-full border border-[#ff9f43]/50"
          style={{ animationDelay: `${d}s` }}
        />
      ))}

      {/* the logo, tilting toward the pointer */}
      <div className="absolute inset-[23%] [perspective:900px]">
        <div
          ref={tiltRef}
          className="relative size-full rounded-full shadow-[0_0_80px_-10px_rgba(255,159,67,0.6)] ring-1 ring-white/10 transition-shadow duration-500 [transform-style:preserve-3d] hover:shadow-[0_0_110px_-6px_rgba(255,159,67,0.85)]"
          style={{ transform: "rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))" }}
        >
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <LogoArt priority className="size-full scale-[1.12] object-cover" />
            {/* light follows the pointer across the surface */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 mix-blend-soft-light"
              style={{ background: "radial-gradient(circle at var(--gx, 50%) var(--gy, 40%), rgba(255,255,255,0.35), transparent 55%)" }}
            />
          </div>

          {/* sparks rising from the mind */}
          {SPARKS.map((s) => (
            <span
              key={s.left + s.top}
              aria-hidden
              className="logo-spark absolute rounded-full bg-[#ffc58a] shadow-[0_0_10px_2px_rgba(255,159,67,0.9)]"
              style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: s.delay }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
