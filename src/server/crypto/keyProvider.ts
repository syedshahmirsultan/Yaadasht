import { createHash } from "node:crypto";
import { decrypt, encrypt } from "./envelope";

/**
 * Wraps and unwraps per-user data keys with the master key.
 *
 * Only this module ever touches the master key. A cloud KMS implementation
 * can be added behind the same interface without changing any caller.
 */
export interface KeyProvider {
  /** Identifies which master key wrapped a user key (stored in user_keys.master_key_id). */
  readonly id: string;
  wrap(userKey: Buffer, userId: string): Promise<Buffer>;
  unwrap(wrapped: Buffer, userId: string): Promise<Buffer>;
}

function wrapAad(userId: string) {
  return Buffer.from(`yaadasht:user-key:v1:${userId}`, "utf8");
}

export class LocalKeyProvider implements KeyProvider {
  readonly id: string;
  readonly #masterKey: Buffer;

  constructor(masterKey: Buffer) {
    if (masterKey.length !== 32) {
      throw new Error("YAADASHT_MASTER_KEY must decode to exactly 32 bytes");
    }
    this.#masterKey = masterKey;
    // A short, non-secret fingerprint so rotations can tell keys apart.
    const fingerprint = createHash("sha256").update(masterKey).digest("hex").slice(0, 12);
    this.id = `local:${fingerprint}`;
  }

  async wrap(userKey: Buffer, userId: string) {
    return encrypt(this.#masterKey, 0, userKey, wrapAad(userId));
  }

  async unwrap(wrapped: Buffer, userId: string) {
    return decrypt(this.#masterKey, wrapped, wrapAad(userId));
  }
}

let provider: KeyProvider | undefined;

export function getKeyProvider(): KeyProvider {
  if (provider) return provider;
  const encoded = process.env.YAADASHT_MASTER_KEY;
  if (!encoded) {
    throw new Error(
      "YAADASHT_MASTER_KEY is not set. Generate one with `npm run keygen` and add it to your environment.",
    );
  }
  provider = new LocalKeyProvider(Buffer.from(encoded, "base64"));
  return provider;
}
