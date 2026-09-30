import { hkdfSync, randomBytes } from "node:crypto";

/**
 * Each user has one random 32-byte User Data Key (UDK), stored only in
 * wrapped form. Purpose-specific keys are derived from it with HKDF so the
 * encryption key and the search-index key are never the same key.
 */
export type UserKeys = {
  userId: string;
  keyVersion: number;
  /** AES-256-GCM key for content fields */
  encKey: Buffer;
  /** HMAC key for the blind search index */
  searchKey: Buffer;
};

export function generateUserDataKey(): Buffer {
  return randomBytes(32);
}

function derive(udk: Buffer, info: string): Buffer {
  return Buffer.from(hkdfSync("sha256", udk, Buffer.alloc(0), info, 32));
}

export function deriveUserKeys(userId: string, keyVersion: number, udk: Buffer): UserKeys {
  if (udk.length !== 32) throw new Error("User data key must be 32 bytes");
  return {
    userId,
    keyVersion,
    encKey: derive(udk, "yaadasht:enc:v1"),
    searchKey: derive(udk, "yaadasht:search:v1"),
  };
}
