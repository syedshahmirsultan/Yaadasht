import { BookOpen, Footprints, GraduationCap, Heart, Lightbulb, MapPin, Sprout, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoOrb } from "./logo-orb";

type Chip = { icon: typeof BookOpen; label: string; when: string; tint: string };

const INNER: Chip[] = [
  { icon: Lightbulb, label: "Idea: a book café", when: "6 months ago", tint: "text-[#ffb86b]" },
  { icon: Heart, label: "Ammi's laugh", when: "3 years ago", tint: "text-[#ff8fab]" },
  { icon: GraduationCap, label: "Learned: RSC", when: "last week", tint: "text-[#8fa2ff]" },
];
const OUTER: Chip[] = [
  { icon: MapPin, label: "Hunza, 2024", when: "2 years ago", tint: "text-[#63e6be]" },
  { icon: BookOpen, label: "Atomic Habits notes", when: "1 year ago", tint: "text-[#ffb86b]" },
  { icon: Footprints, label: "Ran my first 5K", when: "8 months ago", tint: "text-[#b197fc]" },
  { icon: Sprout, label: "Planted a mango tree", when: "5 years ago", tint: "text-[#8ce99a]" },
  { icon: Star, label: "Got the job!", when: "4 years ago", tint: "text-[#ffd43b]" },
];

/**
 * A ring of memory chips orbiting the logo. Chips counter-rotate so they stay
 * upright. Hovering a chip pauses every orbit (see .orbit-stage in globals.css)
 * and opens it up to show when the memory happened.
 */
function Ring({
  chips,
  radius,
  duration,
  reverse,
  offset = 0,
}: {
  chips: Chip[];
  radius: string;
  duration: string;
  reverse?: boolean;
  offset?: number;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "orbit-ring pointer-events-none absolute inset-0 m-auto rounded-full border border-white/[0.06]",
        reverse ? "animate-counter-orbit" : "animate-orbit",
      )}
      style={{ width: radius, height: radius, ["--orbit-duration" as string]: duration }}
    >
      {chips.map((c, i) => {
        const a = ((2 * Math.PI) / chips.length) * i + (offset * Math.PI) / 180;
        return (
          <div
            key={c.label}
            className="absolute w-max"
            style={{ left: `${50 + 50 * Math.sin(a)}%`, top: `${50 - 50 * Math.cos(a)}%`, translate: "-50% -50%" }}
          >
            <div className={reverse ? "animate-orbit" : "animate-counter-orbit"} style={{ ["--orbit-duration" as string]: duration }}>
              <div className="orbit-chip group/chip pointer-events-auto flex cursor-default items-center gap-1.5 rounded-full border border-white/10 bg-[#0c1122]/80 px-3 py-1.5 text-xs font-medium whitespace-nowrap text-[#eef1fb] shadow-[0_8px_30px_-8px_rgba(0,0,0,0.7)] backdrop-blur-md transition-[scale,border-color,background-color,box-shadow] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-115 hover:border-[#ff9f43]/70 hover:bg-[#151c36] hover:shadow-[0_0_32px_-4px_rgba(255,159,67,0.75)]">
                <c.icon
                  className={cn(
                    "size-3.5 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/chip:scale-125 group-hover/chip:-rotate-12",
                    c.tint,
                  )}
                />
                {c.label}
                <span className="grid grid-cols-[0fr] transition-[grid-template-columns] duration-300 group-hover/chip:grid-cols-[1fr]">
                  <span className="overflow-hidden text-[#ffc58a]">&nbsp;· {c.when}</span>
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function HeroOrbit() {
  return (
    <div className="orbit-stage relative mx-auto aspect-square w-full max-w-[560px]">
      <LogoOrb />
      {/* Both rings turn together, staggered, so chips never overlap */}
      <Ring chips={OUTER} radius="100%" duration="80s" reverse />
      <Ring chips={INNER} radius="68%" duration="80s" reverse offset={36} />
    </div>
  );
}
