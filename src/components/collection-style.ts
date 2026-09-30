import { BookOpen, Folder, Lightbulb, Sparkles, type LucideIcon } from "lucide-react";

export const COLLECTION_ICONS: Record<string, LucideIcon> = {
  "book-open": BookOpen,
  lightbulb: Lightbulb,
  sparkles: Sparkles,
  folder: Folder,
};

/** Soft tints, readable in light and dark mode. */
export const COLLECTION_COLORS: Record<string, string> = {
  saffron: "bg-[#f3e6d3] text-[#7a4e1a] dark:bg-[#2e2a22] dark:text-[#e4b777]",
  sage: "bg-[#e3ebdf] text-[#3f5a37] dark:bg-[#232b22] dark:text-[#a9c39e]",
  dusk: "bg-[#e6e3f0] text-[#4a4470] dark:bg-[#26243a] dark:text-[#b7b0e0]",
  rose: "bg-[#f3e1df] text-[#7d3b33] dark:bg-[#2f2221] dark:text-[#e0a79f]",
  sky: "bg-[#dfe9f0] text-[#2f5670] dark:bg-[#1f2a33] dark:text-[#9dc2dc]",
};
