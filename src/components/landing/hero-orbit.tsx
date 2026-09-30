import {
  Baby,
  BookOpen,
  Camera,
  Footprints,
  Gem,
  GraduationCap,
  Heart,
  Lightbulb,
  MapPin,
  Music,
  Plane,
  Sprout,
  Star,
  Sunrise,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoOrb } from "./logo-orb";

type Memory = { icon: typeof BookOpen; label: string; when: string; tint: string };

// Labelled cards on the outer orbit. Spacing was measured so none ever collide.
const CARDS: Memory[] = [
  { icon: MapPin, label: "Kyoto, 2024", when: "2 years ago", tint: "text-[#63e6be]" },
  { icon: Lightbulb, label: "Idea: a rooftop garden", when: "6 months ago", tint: "text-[#ffb86b]" },
  { icon: Heart, label: "Mom's laugh", when: "3 years ago", tint: "text-[#ff8fab]" },
  { icon: BookOpen, label: "Atomic Habits notes", when: "1 year ago", tint: "text-[#ffb86b]" },
  { icon: Star, label: "Got the job!", when: "4 years ago", tint: "text-[#ffd43b]" },
  { icon: GraduationCap, label: "Learned: Spanish basics", when: "last week", tint: "text-[#8fa2ff]" },
  { icon: Footprints, label: "Ran my first 5K", when: "8 months ago", tint: "text-[#b197fc]" },
  { icon: Sprout, label: "Planted an apple tree", when: "5 years ago", tint: "text-[#8ce99a]" },
  { icon: Gem, label: "Our wedding day", when: "7 years ago", tint: "text-[#f783ac]" },
];

// Small memory bubbles close to the mind; they open on hover.
const BUBBLES: Memory[] = [
  { icon: Baby, label: "Her first steps", when: "2 years ago", tint: "text-[#ffd8a8]" },
  { icon: Music, label: "First cello lesson", when: "3 months ago", tint: "text-[#b197fc]" },
  { icon: Plane, label: "Flight to Lisbon", when: "1 year ago", tint: "text-[#74c0fc]" },
  { icon: Camera, label: "Sunset at the pier", when: "9 years ago", tint: "text-[#ffa94d]" },
  { icon: Sunrise, label: "Graduation morning", when: "6 years ago", tint: "text-[#ffe066]" },
];

/**
 * One animated angle (--orbit-angle, see globals.css) drives every card's
 * position with CSS sin()/cos(). Cards never rotate, so they always stay
 * upright and can never drift out of sync.
 */
function Slot({ angle, radius, children }: { angle: number; radius: number; children: React.ReactNode }) {
  const theta = `calc(var(--orbit-angle) + ${angle}deg)`;
  return (
    <div
      className="orbit-slot absolute w-max"
      style={{
        left: `calc(50% + ${radius * 50}cqw * sin(${theta}))`,
        top: `calc(50% - ${radius * 50}cqw * cos(${theta}))`,
        translate: "-50% -50%",
      }}
    >
      {children}
    </div>
  );
}

const reveal =
  "grid grid-cols-[0fr] transition-[grid-template-columns] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/chip:grid-cols-[1fr]";

export function HeroOrbit() {
  return (
    <div className="orbit-stage relative mx-auto aspect-square w-full max-w-[560px]">
      <LogoOrb />

      {/* orbit guides */}
      <div aria-hidden className="pointer-events-none absolute inset-0 rounded-full border border-white/[0.06]" />
      <div aria-hidden className="pointer-events-none absolute inset-[20%] rounded-full border border-dashed border-white/[0.07]" />

      <div aria-hidden>
        {CARDS.map((c, i) => (
          <Slot key={c.label} angle={(360 / CARDS.length) * i} radius={1}>
            <div className="orbit-chip group/chip flex cursor-default items-center gap-1.5 rounded-full border border-white/10 bg-[#0c1122] px-3 py-1.5 text-xs font-medium whitespace-nowrap text-[#eef1fb] shadow-[0_8px_24px_-8px_rgba(0,0,0,0.7)] transition-[scale,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-115 hover:border-[#ff9f43]/70 hover:shadow-[0_0_32px_-4px_rgba(255,159,67,0.75)]">
              <c.icon
                className={cn(
                  "size-3.5 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/chip:scale-125 group-hover/chip:-rotate-12",
                  c.tint,
                )}
              />
              {c.label}
              <span className={reveal}>
                <span className="overflow-hidden text-[#ffc58a]">&nbsp;· {c.when}</span>
              </span>
            </div>
          </Slot>
        ))}

        {BUBBLES.map((b, i) => (
          <Slot key={b.label} angle={(360 / BUBBLES.length) * i + 16} radius={0.6}>
            <div className="orbit-chip group/chip flex cursor-default items-center rounded-full border border-white/15 bg-[#0c1122] p-2 text-xs font-medium whitespace-nowrap text-[#eef1fb] shadow-[0_0_18px_-4px_rgba(255,159,67,0.55)] transition-[scale,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-110 hover:border-[#ff9f43]/70 hover:shadow-[0_0_32px_-4px_rgba(255,159,67,0.8)]">
              <b.icon className={cn("size-4", b.tint)} />
              <span className={reveal}>
                <span className="overflow-hidden">
                  <span className="pr-1.5 pl-2">{b.label}</span>
                  <span className="pr-1 text-[#ffc58a]">· {b.when}</span>
                </span>
              </span>
            </div>
          </Slot>
        ))}
      </div>
    </div>
  );
}
