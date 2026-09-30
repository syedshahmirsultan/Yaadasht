import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * AES-256-GCM with a fresh random 96-bit nonce per message.
 *
 * Stored layout (bytea):
 *   version (1) ‖ keyVersion (2, big-endian) ‖ nonce (12) ‖ ciphertext ‖ tag (16)
 *
 * The version byte lets us change algorithms in the future without breaking
 * entries written decades earlier. Associated data binds every ciphertext to
 * where it lives (table, column, row, owner), so it cannot be moved elsewhere.
 */

export const FORMAT_VERSION = 1;

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const NONCE_BYTES = 12;
const TAG_BYTES = 16;
const HEADER_BYTES = 1 + 2 + NONCE_BYTES;

export class DecryptionError extends Error {
  constructor(message = "Could not decrypt data") {
    super(message);
    this.name = "DecryptionError";
  }
}

function assertKey(key: Buffer) {
  if (key.length !== KEY_BYTES) throw new Error("Encryption key must be 32 bytes");
}

export function encrypt(key: Buffer, keyVersion: number, plaintext: Buffer, aad: Buffer): Buffer {
  assertKey(key);
  if (!Number.isInteger(keyVersion) || keyVersion < 0 || keyVersion > 0xffff) {
    throw new Error("Invalid key version");
  }

  const header = Buffer.alloc(HEADER_BYTES);
  header.writeUInt8(FORMAT_VERSION, 0);
  header.writeUInt16BE(keyVersion, 1);
  const nonce = randomBytes(NONCE_BYTES);
  nonce.copy(header, 3);

  const cipher = createCipheriv(ALGORITHM, key, nonce, { authTagLength: TAG_BYTES });
  // The header is authenticated too, so the version fields cannot be tampered with.
  cipher.setAAD(Buffer.concat([header, aad]));
  const body = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return Buffer.concat([header, body, cipher.getAuthTag()]);
}

export function decrypt(key: Buffer, blob: Buffer, aad: Buffer): Buffer {
  assertKey(key);
  if (blob.length < HEADER_BYTES + TAG_BYTES) throw new DecryptionError("Ciphertext too short");
  const version = blob.readUInt8(0);
  if (version !== FORMAT_VERSION) throw new DecryptionError(`Unsupported format version ${version}`);

  const header = blob.subarray(0, HEADER_BYTES);
  const nonce = blob.subarray(3, HEADER_BYTES);
  const tag = blob.subarray(blob.length - TAG_BYTES);
  const body = blob.subarray(HEADER_BYTES, blob.length - TAG_BYTES);

  try {
    const decipher = createDecipheriv(ALGORITHM, key, nonce, { authTagLength: TAG_BYTES });
    decipher.setAAD(Buffer.concat([header, aad]));
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(body), decipher.final()]);
  } catch {
    throw new DecryptionError();
  }
}

export function readKeyVersion(blob: Buffer): number {
  if (blob.length < HEADER_BYTES) throw new DecryptionError("Ciphertext too short");
  return blob.readUInt16BE(1);
}
