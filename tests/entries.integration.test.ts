import { config } from "dotenv";
import { eq, sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

config({ path: ".env.local" });

describe.runIf(process.env.DATABASE_URL && process.env.YAADASHT_MASTER_KEY)("memories end to end", { timeout: 120_000 }, async () => {
  const { getDb } = await import("@/server/db");
  const { collections, userKeys, users } = await import("@/server/db/schema");
  const { createUserKeyMaterial } = await import("@/server/crypto/userKeys");
  const entries = await import("@/server/entries");
  const cols = await import("@/server/collections");
  const { uuidv7 } = await import("@/lib/id");

  const db = getDb();
  const userId = uuidv7();
  const journalId = uuidv7();
  const otherUserId = uuidv7();

  beforeAll(async () => {
    for (const id of [userId, otherUserId]) {
      await db.insert(users).values({ id, clerkUserId: `test_${id}`, storageQuotaBytes: 1, timezone: "Asia/Karachi" });
      await db.insert(userKeys).values(await createUserKeyMaterial(id));
    }
    await db.insert(collections).values([
      { id: journalId, userId, kind: "journal" },
      { id: uuidv7(), userId, kind: "learnings", position: 1 },
      { id: uuidv7(), userId, kind: "ideas", position: 2 },
    ]);
  });

  afterAll(async () => {
    await db.delete(users).where(eq(users.id, userId));
    await db.delete(users).where(eq(users.id, otherUserId));
  });

  const body = {
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: "What did you learn?" }] },
      { type: "paragraph", content: [{ type: "text", text: "Ammi taught me her biryani with saffron." }] },
    ],
  };

  let entryId = "";
  let revision = 0;

  it("saves a new memory, encrypted", async () => {
    const res = await entries.saveEntry(userId, {
      collectionId: journalId,
      memoryDate: "2025-09-30",
      title: "Biryani day",
      body,
      tags: ["family", "Food", "family"],
    });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    entryId = res.id;
    revision = res.revision;

    const raw = await db.execute<{ t: string; b: string }>(
      sql`select encode(title_enc,'escape') t, encode(body_enc,'escape') b from yaadasht.entries where id = ${entryId}`,
    );
    expect(raw[0].t).not.toContain("Biryani");
    expect(raw[0].b).not.toContain("saffron");
  });

  it("reads it back with de-duplicated tags", async () => {
    const e = await entries.getEntry(userId, entryId);
    expect(e?.title).toBe("Biryani day");
    expect(e?.tags).toEqual(["family", "Food"]);
    expect(e?.excerpt).toContain("biryani");
    expect(e?.wordCount).toBeGreaterThan(5);
  });

  it("is invisible to another user", async () => {
    expect(await entries.getEntry(otherUserId, entryId)).toBeNull();
    expect(await entries.searchEntries(otherUserId, "biryani")).toHaveLength(0);
  });

  it("autosaves with revisions and detects conflicts", async () => {
    const next = await entries.saveEntry(userId, { id: entryId, revision, collectionId: journalId, memoryDate: "2025-09-30", title: "Biryani day", body, tags: ["family"] });
    expect(next.ok && next.revision).toBe(revision + 1);
    const stale = await entries.saveEntry(userId, { id: entryId, revision, collectionId: journalId, memoryDate: "2025-09-30", title: "old", body, tags: [] });
    expect(stale).toEqual({ ok: false, reason: "conflict" });
  });

  it("finds it by keyword, prefix and tag", async () => {
    expect((await entries.searchEntries(userId, "biryani")).map((h) => h.id)).toContain(entryId);
    expect((await entries.searchEntries(userId, "biry")).map((h) => h.id)).toContain(entryId);
    expect((await entries.searchEntries(userId, "family")).map((h) => h.id)).toContain(entryId);
    expect(await entries.searchEntries(userId, "biryani pizza")).toHaveLength(0);
    const [hit] = await entries.searchEntries(userId, "saffron");
    expect(hit.snippet.toLowerCase()).toContain("saffron");
  });

  it("shows up on this day in later years", async () => {
    expect((await entries.onThisDay(userId, "2026-09-30")).map((e) => e.id)).toContain(entryId);
    expect(await entries.onThisDay(userId, "2026-10-01")).toHaveLength(0);
  });

  it("moves to trash, restores, and deletes forever", async () => {
    await entries.moveToTrash(userId, entryId);
    expect(await entries.getEntry(userId, entryId)).toBeNull();
    expect((await entries.listEntries(userId, { trash: true })).map((e) => e.id)).toContain(entryId);
    expect(await entries.searchEntries(userId, "biryani")).toHaveLength(0);
    await entries.restoreFromTrash(userId, entryId);
    expect(await entries.getEntry(userId, entryId)).not.toBeNull();
    await entries.moveToTrash(userId, entryId);
    await entries.deleteForever(userId, entryId);
    expect(await entries.getEntry(userId, entryId, { includeDeleted: true })).toBeNull();
  });

  it("creates, renames and deletes custom collections safely", async () => {
    const id = await cols.createCollection(userId, { name: "Travel", color: "sky", icon: "plane" });
    await cols.updateCollection(userId, id, { name: "Journeys" });
    expect((await cols.getCollection(userId, id))?.name).toBe("Journeys");
    expect(await cols.deleteCollection(userId, journalId)).toBe("protected");
    expect(await cols.deleteCollection(userId, id)).toBe("ok");
  });

});
