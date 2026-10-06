import "server-only";
import { and, asc, count, eq, isNull, sql } from "drizzle-orm";
import { uuidv7 } from "@/lib/id";
import { openTextOrNull, sealText } from "@/server/crypto/fields";
import { getUserKeys } from "@/server/crypto/userKeys";
import { getDb } from "@/server/db";
import { collections, entries, type CollectionKind } from "@/server/db/schema";

export const DEFAULT_COLLECTION_COPY: Record<Exclude<CollectionKind, "custom">, { name: string; description: string }> = {
  journal: { name: "Journal", description: "Your days, in your own words." },
  learnings: { name: "Learnings", description: "Things you learned and want to keep." },
  ideas: { name: "Ideas", description: "Sparks, plans and what-ifs." },
};

export type CollectionView = {
  id: string;
  kind: CollectionKind;
  name: string;
  description: string | null;
  color: string;
  icon: string;
  entryCount: number;
};

export async function listCollections(userId: string): Promise<CollectionView[]> {
  const db = getDb();
  const [rows, counts, keys] = await Promise.all([
    db
      .select()
      .from(collections)
      .where(and(eq(collections.userId, userId), isNull(collections.archivedAt)))
      .orderBy(asc(collections.position)),
    db
      .select({ collectionId: entries.collectionId, n: count() })
      .from(entries)
      .where(and(eq(entries.userId, userId), isNull(entries.deletedAt)))
      .groupBy(entries.collectionId),
    getUserKeys(userId),
  ]);
  const countBy = new Map(counts.map((c) => [c.collectionId, c.n]));

  return rows.map((c) => {
    const custom = openTextOrNull(keys, { table: "collections", column: "name_enc", rowId: c.id }, c.nameEnc);
    const defaults = c.kind === "custom" ? null : DEFAULT_COLLECTION_COPY[c.kind];
    return {
      id: c.id,
      kind: c.kind,
      name: custom ?? defaults?.name ?? "Untitled collection",
      description: defaults?.description ?? null,
      color: c.color,
      icon: c.icon,
      entryCount: countBy.get(c.id) ?? 0,
    };
  });
}

export async function countEntries(userId: string): Promise<number> {
  const [row] = await getDb()
    .select({ n: count() })
    .from(entries)
    .where(and(eq(entries.userId, userId), isNull(entries.deletedAt)));
  return row?.n ?? 0;
}

// ── Managing collections ─────────────────────────────────────────────────────

export const COLLECTION_COLOR_KEYS = [
  "saffron",
  "sage",
  "dusk",
  "rose",
  "sky",
  "emerald",
  "violet",
  "amber",
  "crimson",
  "coral",
  "indigo",
  "teal",
] as const;

export const COLLECTION_ICON_KEYS = [
  "book-open",
  "lightbulb",
  "sparkles",
  "folder",
  "plane",
  "heart",
  "briefcase",
  "graduation-cap",
  "bookmark",
  "camera",
  "code",
  "coffee",
  "compass",
  "feather",
  "flame",
  "globe",
  "headphones",
  "map-pin",
  "music",
  "palette",
  "shield",
  "star",
  "sun",
  "target",
  "trophy",
  "zap",
] as const;

export async function getCollection(userId: string, id: string): Promise<CollectionView | null> {
  const all = await listCollections(userId);
  return all.find((c) => c.id === id) ?? null;
}

export async function createCollection(
  userId: string,
  input: { name: string; color: string; icon: string },
): Promise<string> {
  const db = getDb();
  const keys = await getUserKeys(userId);
  const id = uuidv7();
  const [{ max }] = await db
    .select({ max: sql<number>`coalesce(max(${collections.position}), 0)` })
    .from(collections)
    .where(eq(collections.userId, userId));
  await db.insert(collections).values({
    id,
    userId,
    kind: "custom",
    nameEnc: sealText(keys, { table: "collections", column: "name_enc", rowId: id }, input.name.trim().slice(0, 60)),
    color: input.color,
    icon: input.icon,
    position: Number(max) + 1,
  });
  return id;
}

export async function updateCollection(
  userId: string,
  id: string,
  input: { name?: string; color?: string; icon?: string },
): Promise<void> {
  const keys = await getUserKeys(userId);
  await getDb()
    .update(collections)
    .set({
      ...(input.name !== undefined && {
        nameEnc: sealText(keys, { table: "collections", column: "name_enc", rowId: id }, input.name.trim().slice(0, 60)),
      }),
      ...(input.color && { color: input.color }),
      ...(input.icon && { icon: input.icon }),
      updatedAt: new Date(),
    })
    .where(and(eq(collections.id, id), eq(collections.userId, userId)));
}

/** Only custom, empty collections can be deleted, so no memory is ever lost by accident. */
export async function deleteCollection(userId: string, id: string): Promise<"ok" | "not-empty" | "protected"> {
  const db = getDb();
  const c = await db.query.collections.findFirst({ where: and(eq(collections.id, id), eq(collections.userId, userId)) });
  if (!c || c.kind !== "custom") return "protected";
  const [{ n }] = await db.select({ n: count() }).from(entries).where(eq(entries.collectionId, id));
  if (n > 0) return "not-empty";
  await db.delete(collections).where(eq(collections.id, id));
  return "ok";
}
