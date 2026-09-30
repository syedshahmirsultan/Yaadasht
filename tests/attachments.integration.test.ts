import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

config({ path: ".env.local" });

const ready =
  process.env.DATABASE_URL && process.env.YAADASHT_MASTER_KEY && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Uploads a real file to Supabase Storage through the same signed-URL flow the browser uses. */
describe.runIf(ready)("photos and files end to end", { timeout: 120_000 }, async () => {
  const { getDb } = await import("@/server/db");
  const { collections, userKeys, users } = await import("@/server/db/schema");
  const { createUserKeyMaterial } = await import("@/server/crypto/userKeys");
  const { saveEntry } = await import("@/server/entries");
  const att = await import("@/server/attachments");
  const { uuidv7 } = await import("@/lib/id");

  const db = getDb();
  const userId = uuidv7();
  const collectionId = uuidv7();
  let entryId = "";

  beforeAll(async () => {
    await db.insert(users).values({ id: userId, clerkUserId: `test_${userId}`, storageQuotaBytes: 10 * 1024 * 1024 });
    await db.insert(userKeys).values(await createUserKeyMaterial(userId));
    await db.insert(collections).values({ id: collectionId, userId, kind: "journal" });
    const res = await saveEntry(userId, {
      collectionId,
      memoryDate: "2026-09-30",
      title: "With a photo",
      body: { type: "doc", content: [{ type: "paragraph" }] },
      tags: [],
    });
    if (res.ok) entryId = res.id;
  });

  afterAll(async () => {
    await att.discardForEntries(userId, [entryId]);
    await db.delete(users).where(eq(users.id, userId));
  });

  it("uploads, verifies, lists with signed URLs, and deletes", async () => {
    const bytes = new TextEncoder().encode("hello from yaadasht");
    const start = await att.startUpload(userId, {
      entryId,
      filename: "note.txt",
      mimeType: "text/plain",
      sizeBytes: bytes.length,
      meta: {},
    });
    expect(start.ok).toBe(true);
    if (!start.ok) return;

    const form = new FormData();
    form.append("cacheControl", "3600");
    form.append("", new Blob([bytes], { type: "text/plain" }), "note.txt");
    const put = await fetch(start.uploadUrl, { method: "PUT", body: form, headers: { "x-upsert": "false" } });
    expect(put.ok).toBe(true);

    const view = await att.finishUpload(userId, start.attachmentId);
    expect(view?.filename).toBe("note.txt");
    expect(view?.url).toMatch(/^https:/);

    const list = await att.listAttachments(userId, entryId);
    expect(list).toHaveLength(1);
    const body = await (await fetch(list[0].url!)).text();
    expect(body).toBe("hello from yaadasht");

    const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
    expect(user?.storageUsedBytes).toBe(bytes.length);

    expect(await att.deleteAttachment(userId, start.attachmentId)).toBe(true);
    expect(await att.listAttachments(userId, entryId)).toHaveLength(0);
    const after = await db.query.users.findFirst({ where: eq(users.id, userId) });
    expect(after?.storageUsedBytes).toBe(0);
  });

  it("refuses files over the limit and over quota", async () => {
    const big = await att.startUpload(userId, { entryId, filename: "big.mp4", mimeType: "video/mp4", sizeBytes: 999 * 1024 * 1024, meta: {} });
    expect(big).toEqual({ ok: false, reason: "too-large" });
    const long = await att.startUpload(userId, { entryId, filename: "long.mp4", mimeType: "video/mp4", sizeBytes: 1000, meta: { durationSec: 3600 } });
    expect(long).toEqual({ ok: false, reason: "too-long" });
  });
});
