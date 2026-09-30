import { createHmac } from "node:crypto";

/**
 * Blind index for keyword search over encrypted text.
 *
 * On save, every word (and its prefixes, so results appear while typing) is
 * turned into a keyed HMAC. Only these opaque tokens are stored. A search
 * hashes the query the same way and looks for matching tokens.
 * See docs/SECURITY.md §6 for what this does and does not reveal.
 */

export const TOKEN_BYTES = 16;
const MIN_PREFIX = 3;
const MAX_PREFIX = 12;
const MAX_WORD = 48;
const MAX_TOKENS_PER_ENTRY = 8000;

/** Lowercase, compatibility-normalize, and strip diacritics/harakat. */
export function normalize(text: string): string {
  return text.normalize("NFKD").replace(/\p{M}+/gu, "").toLowerCase().normalize("NFC");
}

/** Words in any script (Latin, Urdu/Arabic, Devanagari, CJK, digits…). */
export function words(text: string): string[] {
  const matches = normalize(text).match(/[\p{L}\p{N}]+/gu) ?? [];
  return matches
    .map((w) => Array.from(w).slice(0, MAX_WORD).join(""))
    .filter((w) => Array.from(w).length >= 2 || /^\p{N}$/u.test(w));
}

/** Plain-text tokens to index for one entry: whole words plus prefixes. */
export function indexTerms(text: string): Set<string> {
  const terms = new Set<string>();
  for (const word of words(text)) {
    if (terms.size >= MAX_TOKENS_PER_ENTRY) break;
    terms.add(`w:${word}`);
    const chars = Array.from(word);
    for (let n = MIN_PREFIX; n <= Math.min(chars.length, MAX_PREFIX); n++) {
      terms.add(`p:${chars.slice(0, n).join("")}`);
    }
  }
  return terms;
}

/**
 * Terms for a search query. Every word must match exactly, except the last
 * one, which matches as a prefix so results update while the person types.
 */
export function queryTerms(query: string): string[] {
  const ws = words(query);
  if (ws.length === 0) return [];
  const endsWithSpace = /\s$/.test(query);
  return ws.map((w, i) => {
    const isLast = i === ws.length - 1;
    const len = Array.from(w).length;
    if (isLast && !endsWithSpace && len >= MIN_PREFIX) {
      return len > MAX_PREFIX ? `w:${w}` : `p:${w}`;
    }
    return `w:${w}`;
  });
}

export function blindToken(searchKey: Buffer, term: string): Buffer {
  return createHmac("sha256", searchKey).update(term, "utf8").digest().subarray(0, TOKEN_BYTES);
}

export function blindTokens(searchKey: Buffer, terms: Iterable<string>): Buffer[] {
  return Array.from(terms, (t) => blindToken(searchKey, t));
}
