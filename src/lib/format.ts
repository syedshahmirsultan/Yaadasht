/** Formats a memory date (YYYY-MM-DD, a calendar day with no time zone). */
export function formatMemoryDate(iso: string, style: "long" | "short" | "day" = "long"): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  const opts: Intl.DateTimeFormatOptions =
    style === "long"
      ? { weekday: "long", day: "numeric", month: "long", year: "numeric" }
      : style === "short"
        ? { day: "numeric", month: "short", year: "numeric" }
        : { weekday: "short", day: "numeric" };
  return new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: "UTC" }).format(date);
}

export function monthLabel(iso: string): string {
  const [y, m] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(y, m - 1, 1)));
}

/** "3 years ago", "1 year ago", "Earlier this year" relative to today (both YYYY-MM-DD). */
export function yearsAgoLabel(iso: string, today: string): string {
  const years = Number(today.slice(0, 4)) - Number(iso.slice(0, 4));
  if (years <= 0) return "Earlier this year";
  return years === 1 ? "1 year ago" : `${years} years ago`;
}
