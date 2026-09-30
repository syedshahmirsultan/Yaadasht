import { z } from "zod";

/** Personal appearance choices. Stored per account so they follow people across devices. */
export const ACCENTS = ["saffron", "rose", "sage", "ocean", "plum"] as const;
export const LAYOUTS = ["sidebar", "topbar"] as const;
export const WRITING_FONTS = ["serif", "sans"] as const;
export const TEXT_SIZES = ["small", "medium", "large"] as const;

export const preferencesSchema = z.object({
  accent: z.enum(ACCENTS).catch("saffron"),
  layout: z.enum(LAYOUTS).catch("sidebar"),
  writingFont: z.enum(WRITING_FONTS).catch("serif"),
  textSize: z.enum(TEXT_SIZES).catch("medium"),
});

export type Preferences = z.infer<typeof preferencesSchema>;

export const DEFAULT_PREFERENCES: Preferences = preferencesSchema.parse({});

/** Tolerates old or partial stored values: unknown fields are dropped, bad values fall back to defaults. */
export function readPreferences(value: unknown): Preferences {
  return preferencesSchema.parse(value && typeof value === "object" ? value : {});
}

export const preferencesPatchSchema = z
  .object({
    accent: z.enum(ACCENTS),
    layout: z.enum(LAYOUTS),
    writingFont: z.enum(WRITING_FONTS),
    textSize: z.enum(TEXT_SIZES),
  })
  .partial()
  .strict();

/** Applied to <html> so every surface (including pop-ups) picks up the choices. */
export function preferenceAttributes(p: Preferences) {
  return {
    "data-accent": p.accent,
    "data-writing-font": p.writingFont,
    "data-text-size": p.textSize,
  } as const;
}
