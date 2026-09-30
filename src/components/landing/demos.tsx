"use client";

import { BookOpen, Check, Lightbulb, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { prefersReducedMotion, useInView } from "./hooks";

const MEMORIES = [
  { ago: "1 year ago", kind: "Learning", text: "Finally understood how compound interest works. Started saving 10% of every salary.", color: "from-[#3d5afe] to-[#7c4dff]" },
  { ago: "3 years ago", kind: "Journal", text: "Ammi taught me her biryani. I burnt the onions twice and she laughed the whole time.", color: "from-[#ff9f43] to-[#f9582d]" },
  { ago: "6 years ago", kind: "Idea", text: "A café where every table has a shelf of books you can take home. Call it 'Chapter'.", color: "from-[#12b886] to-[#0c8599]" },
  { ago: "9 years ago", kind: "Journal", text: "Last exam done. We sat by the river until the sun went down and nobody wanted to leave.", color: "from-[#e64980] to-[#ae3ec9]" },
];

/** On this day: memories from past years, gently taking turns. */
export function OnThisDayDemo() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!inView || prefersReducedMotion()) return;
    const t = setInterval(() => setI((n) => (n + 1) % MEMORIES.length), 3200);
    return () => clearInterval(t);
  }, [inView]);
  return (
    <div ref={ref} className="relative mt-6 h-52">
      {MEMORIES.map((m, idx) => {
        const offset = (idx - i + MEMORIES.length) % MEMORIES.length;
        return (
          <article
            key={m.ago}
            aria-hidden={offset !== 0}
            className="absolute inset-x-0 top-0 rounded-2xl border border-border bg-background/90 p-5 shadow-lift backdrop-blur transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
            style={{
              transform: `translateY(${offset * 14}px) scale(${1 - offset * 0.05})`,
              opacity: offset > 2 ? 0 : 1 - offset * 0.3,
              zIndex: MEMORIES.length - offset,
            }}
          >
            <div className="flex items-center gap-3">
              <span className={cn("size-9 rounded-xl bg-gradient-to-br", m.color)} />
              <div className="text-xs">
                <p className="font-semibold text-saffron">{m.ago}</p>
                <p className="text-muted-foreground">{m.kind}</p>
              </div>
            </div>
            <p className="mt-3 font-writing text-[1.05rem] leading-snug">{m.text}</p>
          </article>
        );
      })}
    </div>
  );
}

const QUERIES = [
  { q: "react", hits: ["Learned: React Server Components stream HTML", "Idea: a React course for my cousins"] },
  { q: "ammi", hits: ["Ammi's biryani, step by step", "The day Ammi visited my office"] },
  { q: "hunza", hits: ["Trip to Hunza: the cherry blossoms", "Learned: how glaciers carve valleys"] },
];

/** Search: type a word, find it across years of writing. */
export function SearchDemo() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const [qi, setQi] = useState(0);
  const [typed, setTyped] = useState("");
  useEffect(() => {
    if (!inView) return;
    if (prefersReducedMotion()) {
      const t = setTimeout(() => setTyped(QUERIES[0].q), 0);
      return () => clearTimeout(t);
    }
    let pos = 0;
    let t: ReturnType<typeof setTimeout>;
    const q = QUERIES[qi].q;
    const step = () => {
      pos++;
      setTyped(q.slice(0, pos));
      if (pos < q.length) t = setTimeout(step, 140);
      else t = setTimeout(() => { setTyped(""); setQi((n) => (n + 1) % QUERIES.length); }, 2600);
    };
    t = setTimeout(step, 400);
    return () => clearTimeout(t);
  }, [inView, qi]);
  const done = typed === QUERIES[qi].q;
  return (
    <div ref={ref} className="mt-6">
      <div className="flex h-11 items-center gap-2.5 rounded-xl border border-border bg-background/80 px-3.5">
        <Search className="size-4 text-muted-foreground" aria-hidden />
        <span className="text-sm">
          {typed}
          <span className="animate-caret ml-px inline-block h-4 w-px translate-y-0.5 bg-foreground" />
        </span>
      </div>
      <ul className="mt-3 space-y-2">
        {QUERIES[qi].hits.map((h, k) => (
          <li
            key={h}
            className={cn(
              "flex items-center gap-2.5 rounded-xl bg-muted/60 px-3.5 py-2.5 text-sm transition-all duration-500",
              done ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
            )}
            style={{ transitionDelay: done ? `${k * 120}ms` : "0ms" }}
          >
            {k === 0 ? <BookOpen className="size-4 text-saffron" /> : <Lightbulb className="size-4 text-electric" />}
            <span className="truncate">{h}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const ACCENTS = [
  { name: "Amber", c: "#ff9f43" },
  { name: "Rose", c: "#e0879a" },
  { name: "Sage", c: "#8fbc88" },
  { name: "Ocean", c: "#6fb0d8" },
  { name: "Plum", c: "#b194d6" },
];

/** Make it yours: try the accent colours right here. */
export function AccentDemo() {
  const [a, setA] = useState(0);
  const color = ACCENTS[a].c;
  return (
    <div className="mt-6">
      <div className="rounded-2xl border border-border bg-background/80 p-4 transition-colors duration-500" style={{ boxShadow: `0 0 0 1px ${color}33, 0 20px 40px -24px ${color}` }}>
        <div className="flex items-center justify-between text-xs">
          <span className="rounded-full px-2.5 py-1 font-medium transition-colors duration-500" style={{ background: `${color}26`, color }}>
            Journal
          </span>
          <span className="text-muted-foreground">Today</span>
        </div>
        <p className="mt-3 font-writing text-lg leading-snug">A quiet evening, and a good book.</p>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-2/3 rounded-full transition-colors duration-500" style={{ background: color }} />
        </div>
      </div>
      <div role="radiogroup" aria-label="Try an accent colour" className="mt-4 flex gap-2.5">
        {ACCENTS.map((x, idx) => (
          <button
            key={x.name}
            type="button"
            role="radio"
            aria-checked={a === idx}
            aria-label={x.name}
            onClick={() => setA(idx)}
            className={cn("size-8 rounded-full transition hover:scale-110", a === idx && "ring-2 ring-foreground/70 ring-offset-2 ring-offset-card")}
            style={{ background: x.c }}
          >
            {a === idx && <Check className="mx-auto size-4 text-white" aria-hidden />}
          </button>
        ))}
      </div>
    </div>
  );
}

const IDEAS = ["A podcast about grandparents' stories", "Learn to play the rubab", "Build a tiny library at the park", "Write letters to my kids for their 18th birthdays", "Plant a mango tree"];

/** Ideas float up like thoughts you caught just in time. */
export function IdeasDemo() {
  return (
    <div className="relative mt-6 h-44 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)]">
      <div className="animate-marquee flex flex-col gap-2.5 [--marquee-duration:18s] [animation-name:ideas-up]">
        {[...IDEAS, ...IDEAS].map((idea, k) => (
          <div key={k} className="flex items-center gap-2.5 rounded-xl border border-border bg-background/80 px-3.5 py-2.5 text-sm">
            <Lightbulb className="size-4 shrink-0 text-saffron" aria-hidden />
            {idea}
          </div>
        ))}
      </div>
    </div>
  );
}
