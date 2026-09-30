import "server-only";

/**
 * Minimal structured logger. Anything that could hold a person's writing is
 * redacted before it is printed. Never log request bodies or entry content.
 */
const REDACT = new Set([
  "body",
  "title",
  "content",
  "text",
  "excerpt",
  "tags",
  "filename",
  "recipient",
  "email",
  "authorization",
  "cookie",
  "password",
  "token",
]);

function redact(value: unknown, depth = 0): unknown {
  if (depth > 4 || value === null || typeof value !== "object") return value;
  if (value instanceof Error) return { name: value.name, message: value.message };
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1));
  return Object.fromEntries(
    Object.entries(value).map(([k, v]) => [k, REDACT.has(k.toLowerCase()) ? "[redacted]" : redact(v, depth + 1)]),
  );
}

function write(level: "info" | "warn" | "error", event: string, data?: Record<string, unknown>) {
  const line = JSON.stringify({ level, event, time: new Date().toISOString(), ...(redact(data ?? {}) as object) });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const log = {
  info: (event: string, data?: Record<string, unknown>) => write("info", event, data),
  warn: (event: string, data?: Record<string, unknown>) => write("warn", event, data),
  error: (event: string, data?: Record<string, unknown>) => write("error", event, data),
};
