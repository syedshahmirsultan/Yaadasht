import "server-only";
import { eq } from "drizzle-orm";
import { getDb } from "@/server/db";
import { userKeys } from "@/server/db/schema";
import { getKeyProvider } from "./keyProvider";
import { deriveUserKeys, generateUserDataKey, type UserKeys } from "./keys";

const TTL_MS = 5 * 60 * 1000;
const MAX_CACHED = 500;

// Unwrapped keys are cached briefly in memory only, never logged or serialized.
const cache = new Map<string, { keys: UserKeys; expiresAt: number }>();

/** Creates a new wrapped key for a user who is signing up. */
export async function createUserKeyMaterial(userId: string) {
  const provider = getKeyProvider();
  const udk = generateUserDataKey();
  const wrappedKey = await provider.wrap(udk, userId);
  udk.fill(0);
  return { userId, keyVersion: 1, wrappedKey, masterKeyId: provider.id };
}

export async function getUserKeys(userId: string): Promise<UserKeys> {
  const hit = cache.get(userId);
  if (hit && hit.expiresAt > Date.now()) return hit.keys;

  const row = await getDb().query.userKeys.findFirst({ where: eq(userKeys.userId, userId) });
  if (!row) throw new Error("Encryption key not found for user");

  const udk = await getKeyProvider().unwrap(row.wrappedKey, userId);
  const keys = deriveUserKeys(userId, row.keyVersion, udk);
  udk.fill(0);

  if (cache.size >= MAX_CACHED) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(userId, { keys, expiresAt: Date.now() + TTL_MS });
  return keys;
}

export function forgetUserKeys(userId: string) {
  cache.delete(userId);
}
