import "server-only";
import { and, asc, count, eq, isNull } from "drizzle-orm";
import { openTextOrNull } from "@/server/crypto/fields";
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
