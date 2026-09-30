import "server-only";
import { and, desc, eq, inArray, isNotNull, isNull, lt, or, sql } from "drizzle-orm";
import { docToText, excerptOf, wordCount, type DocNode } from "@/lib/doc";
import { uuidv7 } from "@/lib/id";
import { blindToken, blindTokens, indexTerms, normalize, queryTerms, words } from "@/server/crypto/blindIndex";
import { openJson, openText, openTextOrNull, sealJson, sealText } from "@/server/crypto/fields";
import type { UserKeys } from "@/server/crypto/keys";
import { getUserKeys } from "@/server/crypto/userKeys";
import { getDb } from "@/server/db";
import { collections, entries, entrySearchTokens, entryTags, tags } from "@/server/db/schema";

/**
 * The only module that reads or writes encrypted entry columns. Callers get
 * plaintext domain objects; the database only ever sees ciphertext.
 */

export type EntryCard = {
  id: string;
  title: string | null;
  excerpt: string;
  memoryDate: string;
  collectionId: string;
  tags: string[];
  wordCount: number;
  hasMedia: boolean;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type EntryFull = EntryCard & { body: DocNode; revision: number };

const ctx = (id: string, column: string) => ({ table: "entries", column, rowId: id });
const tagCtx = (id: string) => ({ table: "tags", column: "name_enc", rowId: id });

export function cleanTags(input: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of input) {
    const t = raw.replace(/^#/, "").trim().replace(/\s+/g, " ").slice(0, 40);
    const key = normalize(t);
    if (!t || seen.has(key)) continue;
    seen.add(key);
    out.push(t);
    if (out.length >= 20) break;
  }
  return out;
}

function tagHmac(keys: UserKeys, name: string) {
  return blindToken(keys.searchKey, `tag:${normalize(name)}`);
}

// ── Reading ──────────────────────────────────────────────────────────────────

async function tagsFor(keys: UserKeys, entryIds: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (entryIds.length === 0) return map;
  const rows = await getDb()
    .select({ entryId: entryTags.entryId, tagId: tags.id, nameEnc: tags.nameEnc })
    .from(entryTags)
    .innerJoin(tags, eq(tags.id, entryTags.tagId))
    .where(and(eq(entryTags.userId, keys.userId), inArray(entryTags.entryId, entryIds)));
  for (const r of rows) {
    const list = map.get(r.entryId) ?? [];
    list.push(openText(keys, tagCtx(r.tagId), r.nameEnc));
    map.set(r.entryId, list);
  }
  for (const list of map.values()) list.sort((a, b) => a.localeCompare(b));
  return map;
}

type Row = typeof entries.$inferSelect;

async function toCards(keys: UserKeys, rows: Row[]): Promise<EntryCard[]> {
  const tagMap = await tagsFor(keys, rows.map((r) => r.id));
  return rows.map((r) => ({
    id: r.id,
    title: openTextOrNull(keys, ctx(r.id, "title_enc"), r.titleEnc),
    excerpt: openTextOrNull(keys, ctx(r.id, "excerpt_enc"), r.excerptEnc) ?? "",
    memoryDate: r.memoryDate,
    collectionId: r.collectionId,
    tags: tagMap.get(r.id) ?? [],
    wordCount: r.wordCount,
    hasMedia: r.hasMedia,
    updatedAt: r.updatedAt,
    deletedAt: r.deletedAt,
  }));
}

export async function getEntry(userId: string, id: string, { includeDeleted = false } = {}): Promise<EntryFull | null> {
  const row = await getDb().query.entries.findFirst({
    where: and(eq(entries.id, id), eq(entries.userId, userId), includeDeleted ? undefined : isNull(entries.deletedAt)),
  });
  if (!row) return null;
  const keys = await getUserKeys(userId);
  const [card] = await toCards(keys, [row]);
  return { ...card, body: openJson<DocNode>(keys, ctx(row.id, "body_enc"), row.bodyEnc), revision: row.revision };
}

export async function listEntries(
  userId: string,
  opts: { collectionId?: string; limit?: number; before?: { date: string; id: string }; trash?: boolean } = {},
): Promise<EntryCard[]> {
  const { collectionId, limit = 30, before, trash = false } = opts;
  const rows = await getDb()
    .select()
    .from(entries)
    .where(
      and(
        eq(entries.userId, userId),
        trash ? isNotNull(entries.deletedAt) : isNull(entries.deletedAt),
        collectionId ? eq(entries.collectionId, collectionId) : undefined,
        before
          ? or(lt(entries.memoryDate, before.date), and(eq(entries.memoryDate, before.date), lt(entries.id, before.id)))
          : undefined,
      ),
    )
    .orderBy(trash ? desc(entries.deletedAt) : desc(entries.memoryDate), desc(entries.id))
    .limit(limit);
  return toCards(await getUserKeys(userId), rows);
}

/** Memories written on this calendar day in earlier years. */
export async function onThisDay(userId: string, today: string): Promise<EntryCard[]> {
  const [y, m, d] = today.split("-").map(Number);
  const rows = await getDb()
    .select()
    .from(entries)
    .where(
      and(
        eq(entries.userId, userId),
        isNull(entries.deletedAt),
        sql`extract(month from ${entries.memoryDate}) = ${m}`,
        sql`extract(day from ${entries.memoryDate}) = ${d}`,
        sql`extract(year from ${entries.memoryDate}) < ${y}`,
      ),
    )
    .orderBy(desc(entries.memoryDate))
    .limit(20);
  return toCards(await getUserKeys(userId), rows);
}

export type SearchHit = EntryCard & { snippet: string };

export async function searchEntries(userId: string, query: string, limit = 40): Promise<SearchHit[]> {
  const terms = queryTerms(query);
  if (terms.length === 0) return [];
  const keys = await getUserKeys(userId);
  const tokens = blindTokens(keys.searchKey, terms);
  const db = getDb();

  const matches = await db
    .select({ entryId: entrySearchTokens.entryId })
    .from(entrySearchTokens)
    .where(and(eq(entrySearchTokens.userId, userId), inArray(entrySearchTokens.token, tokens)))
    .groupBy(entrySearchTokens.entryId)
    .having(sql`count(distinct ${entrySearchTokens.token}) = ${new Set(tokens.map((t) => t.toString("hex"))).size}`)
    .limit(200);
  if (matches.length === 0) return [];

  const rows = await db
    .select()
    .from(entries)
    .where(and(eq(entries.userId, userId), isNull(entries.deletedAt), inArray(entries.id, matches.map((m) => m.entryId))))
    .orderBy(desc(entries.memoryDate))
    .limit(limit);

  const cards = await toCards(keys, rows);
  const needles = words(query);
  return rows.map((row, i) => {
    const text = docToText(openJson<DocNode>(keys, ctx(row.id, "body_enc"), row.bodyEnc));
    return { ...cards[i], snippet: snippetAround(text, needles) };
  });
}

function snippetAround(text: string, needles: string[]): string {
  const flat = text.replace(/\s+/g, " ").trim();
  const lower = normalize(flat);
  let at = -1;
  for (const n of needles) {
    at = lower.indexOf(n);
    if (at >= 0) break;
  }
  if (at < 0) return excerptOf(flat, 180);
  const start = Math.max(0, at - 70);
  const end = Math.min(flat.length, at + 130);
  return `${start > 0 ? "…" : ""}${flat.slice(start, end).trim()}${end < flat.length ? "…" : ""}`;
}

// ── Writing ──────────────────────────────────────────────────────────────────

export type SaveInput = {
  id?: string;
  revision?: number;
  collectionId: string;
  memoryDate: string;
  title: string;
  body: DocNode;
  tags: string[];
};

export type SaveResult = { ok: true; id: string; revision: number } | { ok: false; reason: "conflict" | "not-found" };

export async function saveEntry(userId: string, input: SaveInput): Promise<SaveResult> {
  const db = getDb();
  const keys = await getUserKeys(userId);

  const collection = await db.query.collections.findFirst({
    where: and(eq(collections.id, input.collectionId), eq(collections.userId, userId)),
  });
  if (!collection) return { ok: false, reason: "not-found" };

  const id = input.id ?? uuidv7();
  const title = input.title.trim().slice(0, 300);
  const tagNames = cleanTags(input.tags);
  const text = docToText(input.body);
  const values = {
    collectionId: input.collectionId,
    memoryDate: input.memoryDate,
    titleEnc: title ? sealText(keys, ctx(id, "title_enc"), title) : null,
    bodyEnc: sealJson(keys, ctx(id, "body_enc"), input.body),
    excerptEnc: sealText(keys, ctx(id, "excerpt_enc"), excerptOf(text)),
    wordCount: wordCount(`${title} ${text}`),
    updatedAt: new Date(),
  };

  return db.transaction(async (tx) => {
    let revision: number;
    if (!input.id) {
      await tx.insert(entries).values({ id, userId, ...values, revision: 1 });
      revision = 1;
    } else {
      const [row] = await tx
        .update(entries)
        .set({ ...values, revision: sql`${entries.revision} + 1` })
        .where(
          and(
            eq(entries.id, id),
            eq(entries.userId, userId),
            isNull(entries.deletedAt),
            input.revision ? eq(entries.revision, input.revision) : undefined,
          ),
        )
        .returning({ revision: entries.revision });
      if (!row) {
        const exists = await tx.query.entries.findFirst({ where: and(eq(entries.id, id), eq(entries.userId, userId)) });
        return { ok: false as const, reason: exists ? ("conflict" as const) : ("not-found" as const) };
      }
      revision = row.revision;
    }

    // Tags: find or create them in bulk, matched by a keyed hash (never by plaintext).
    // Few round trips matter: the database may be far away.
    const tagIds: string[] = [];
    if (tagNames.length) {
      const wanted = tagNames.map((name) => ({ name, hmac: tagHmac(keys, name) }));
      const hex = (b: Buffer) => b.toString("hex");
      const findExisting = () =>
        tx
          .select({ id: tags.id, nameHmac: tags.nameHmac })
          .from(tags)
          .where(and(eq(tags.userId, userId), inArray(tags.nameHmac, wanted.map((w) => w.hmac))));
      let existing = await findExisting();
      const have = new Set(existing.map((t) => hex(t.nameHmac)));
      const missing = wanted.filter((w) => !have.has(hex(w.hmac)));
      if (missing.length) {
        await tx
          .insert(tags)
          .values(
            missing.map((w) => {
              const tagId = uuidv7();
              return { id: tagId, userId, nameEnc: sealText(keys, tagCtx(tagId), w.name), nameHmac: w.hmac };
            }),
          )
          .onConflictDoNothing();
        existing = await findExisting();
      }
      const byHmac = new Map(existing.map((t) => [hex(t.nameHmac), t.id]));
      for (const w of wanted) {
        const tagId = byHmac.get(hex(w.hmac));
        if (tagId) tagIds.push(tagId);
      }
    }
    if (input.id) await tx.delete(entryTags).where(eq(entryTags.entryId, id));
    if (tagIds.length) await tx.insert(entryTags).values(tagIds.map((tagId) => ({ entryId: id, tagId, userId })));

    // Blind search index.
    if (input.id) await tx.delete(entrySearchTokens).where(eq(entrySearchTokens.entryId, id));
    const tokens = blindTokens(keys.searchKey, indexTerms(`${title}\n${text}\n${tagNames.join(" ")}`));
    for (let i = 0; i < tokens.length; i += 2000) {
      await tx
        .insert(entrySearchTokens)
        .values(tokens.slice(i, i + 2000).map((token) => ({ userId, entryId: id, token })))
        .onConflictDoNothing();
    }

    return { ok: true as const, id, revision };
  });
}

export async function moveToTrash(userId: string, id: string) {
  await getDb()
    .update(entries)
    .set({ deletedAt: new Date() })
    .where(and(eq(entries.id, id), eq(entries.userId, userId)));
}

export async function restoreFromTrash(userId: string, id: string) {
  await getDb()
    .update(entries)
    .set({ deletedAt: null })
    .where(and(eq(entries.id, id), eq(entries.userId, userId)));
}

export async function deleteForever(userId: string, id: string) {
  await getDb()
    .delete(entries)
    .where(and(eq(entries.id, id), eq(entries.userId, userId), isNotNull(entries.deletedAt)));
}

export async function emptyTrash(userId: string) {
  await getDb().delete(entries).where(and(eq(entries.userId, userId), isNotNull(entries.deletedAt)));
}

/** All tag names this person has used, for suggestions. */
export async function listTagNames(userId: string): Promise<string[]> {
  const keys = await getUserKeys(userId);
  const rows = await getDb().select().from(tags).where(eq(tags.userId, userId));
  return rows.map((t) => openText(keys, tagCtx(t.id), t.nameEnc)).sort((a, b) => a.localeCompare(b));
}

export async function trashedEntryIds(userId: string): Promise<string[]> {
  const rows = await getDb()
    .select({ id: entries.id })
    .from(entries)
    .where(and(eq(entries.userId, userId), isNotNull(entries.deletedAt)));
  return rows.map((r) => r.id);
}
