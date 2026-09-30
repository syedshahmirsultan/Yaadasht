import Image from "next/image";
import { cn } from "@/lib/utils";
import { URDU_WORDMARK } from "./calligraphy";

/**
 * The Yaadasht logo: a mind lit up by the memories it keeps.
 * Artwork lives in public/brand; the favicon is generated from it (src/app/icon.png).
 */

/** The logo on a rounded tile, for navigation and small spaces. */
export function LogoTile({ className, title = "Yaadasht" }: { className?: string; title?: string }) {
  return (
    <span
      className={cn(
        "relative inline-flex size-9 shrink-0 overflow-hidden rounded-[28%] bg-[#05070f] ring-1 ring-white/10 transition duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover/logo:scale-110 group-hover/logo:-rotate-6 group-hover/logo:shadow-[0_0_24px_-2px_rgba(255,159,67,0.7)]",
        className,
      )}
    >
      <Image src="/brand/yaadasht-mark.webp" alt={title} fill sizes="96px" className="object-cover" />
    </span>
  );
}

/** The full artwork, for hero moments. */
export function LogoArt({ className, priority = false }: { className?: string; priority?: boolean }) {
  return (
    <Image
      src="/brand/yaadasht-logo.webp"
      alt="Yaadasht: a mind lit up by the memories it keeps"
      width={1024}
      height={1024}
      priority={priority}
      sizes="(min-width: 768px) 520px, 80vw"
      className={cn("select-none", className)}
    />
  );
}

/** یادداشت, the full name in Urdu calligraphy. */
export function UrduWordmark({ className, title = "یادداشت" }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox={URDU_WORDMARK.viewBox}
      className={cn("h-8 w-auto shrink-0", className)}
      {...(title ? { role: "img", "aria-label": title } : { "aria-hidden": true })}
    >
      <path d={URDU_WORDMARK.ink} fill="currentColor" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("font-serif text-[1.4rem] font-medium tracking-[-0.015em]", className)}>Yaadasht</span>
  );
}

/** Logo tile + wordmark, used in navigation and headers. */
export function Logo({ className, tileClassName }: { className?: string; tileClassName?: string }) {
  return (
    <span className={cn("group/logo inline-flex items-center gap-2.5 text-foreground", className)}>
      <LogoTile className={tileClassName} title="" />
      <Wordmark />
    </span>
  );
}
