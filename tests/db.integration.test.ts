import { config } from "dotenv";
import { eq, sql } from "drizzle-orm";
import { afterAll, describe, expect, it } from "vitest";

config({ path: ".env.local" });

/**
 * Runs against a real Postgres (DATABASE_URL in .env.local) with migrations
 * applied. Skipped when no database is configured.
 */
describe.runIf(process.env.DATABASE_URL && process.env.YAADASHT_MASTER_KEY)("database + encryption", { timeout: 30_000 }, async () => {
  const { getDb } = await import("@/server/db");
  const { collections, entries, userKeys, users } = await import("@/server/db/schema");
  const { createUserKeyMaterial, getUserKeys, forgetUserKeys } = await import("@/server/crypto/userKeys");
  const { openText, sealText } = await import("@/server/crypto/fields");
  const { uuidv7 } = await import("@/lib/id");

  const db = getDb();
  const userId = uuidv7();
  const collectionId = uuidv7();
  const entryId = uuidv7();
  const secret = "I finally told my father I was proud of him.";

  afterAll(async () => {
    await db.delete(users).where(eq(users.id, userId));
  });

  it("stores only ciphertext and decrypts it back", async () => {
    await db.insert(users).values({ id: userId, clerkUserId: `test_${userId}`, storageQuotaBytes: 1 });
    await db.insert(userKeys).values(await createUserKeyMaterial(userId));
    await db.insert(collections).values({ id: collectionId, userId, kind: "journal" });

    const keys = await getUserKeys(userId);
    const ctx = { table: "entries", column: "body_enc", rowId: entryId };
    await db.insert(entries).values({
      id: entryId,
      userId,
      collectionId,
      memoryDate: "2026-09-30",
      bodyEnc: sealText(keys, ctx, secret),
    });

    // Raw bytes in the database never contain the plaintext.
    const raw = await db.execute<{ body: string }>(
      sql`select encode(body_enc, 'escape') as body from yaadasht.entries where id = ${entryId}`,
    );
    expect(raw[0].body).not.toContain("proud");

    forgetUserKeys(userId); // force an unwrap from the stored key
    const row = await db.query.entries.findFirst({ where: eq(entries.id, entryId) });
    expect(Buffer.isBuffer(row!.bodyEnc)).toBe(true);
    expect(openText(await getUserKeys(userId), ctx, row!.bodyEnc)).toBe(secret);
  });

  it("deleting the user removes their key and content", async () => {
    await db.delete(users).where(eq(users.id, userId));
    expect(await db.query.userKeys.findFirst({ where: eq(userKeys.userId, userId) })).toBeUndefined();
    expect(await db.query.entries.findFirst({ where: eq(entries.id, entryId) })).toBeUndefined();
  });
});
