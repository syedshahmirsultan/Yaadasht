import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  blindToken,
  indexTerms,
  normalize,
  queryTerms,
  words,
} from "@/server/crypto/blindIndex";
import { DecryptionError, decrypt, encrypt, readKeyVersion } from "@/server/crypto/envelope";
import { openJson, openText, sealJson, sealText } from "@/server/crypto/fields";
import { LocalKeyProvider } from "@/server/crypto/keyProvider";
import { deriveUserKeys, generateUserDataKey } from "@/server/crypto/keys";
import { uuidv7 } from "@/lib/id";

const aad = Buffer.from("context");

describe("envelope (AES-256-GCM)", () => {
  const key = randomBytes(32);

  it("round-trips", () => {
    const blob = encrypt(key, 3, Buffer.from("Today I learned something."), aad);
    expect(decrypt(key, blob, aad).toString()).toBe("Today I learned something.");
    expect(readKeyVersion(blob)).toBe(3);
  });

  it("never produces the same ciphertext twice", () => {
    const a = encrypt(key, 1, Buffer.from("same"), aad);
    const b = encrypt(key, 1, Buffer.from("same"), aad);
    expect(a.equals(b)).toBe(false);
  });

  it("does not contain the plaintext", () => {
    const blob = encrypt(key, 1, Buffer.from("my secret diary"), aad);
    expect(blob.includes(Buffer.from("secret"))).toBe(false);
  });

  it("rejects the wrong key", () => {
    const blob = encrypt(key, 1, Buffer.from("x"), aad);
    expect(() => decrypt(randomBytes(32), blob, aad)).toThrow(DecryptionError);
  });

  it("rejects different associated data", () => {
    const blob = encrypt(key, 1, Buffer.from("x"), aad);
    expect(() => decrypt(key, blob, Buffer.from("other"))).toThrow(DecryptionError);
  });

  it("detects tampering with the body and the header", () => {
    const blob = encrypt(key, 1, Buffer.from("hello world"), aad);
    const body = Buffer.from(blob);
    body[20] ^= 1;
    expect(() => decrypt(key, body, aad)).toThrow(DecryptionError);
    const header = Buffer.from(blob);
    header[2] ^= 1; // key version
    expect(() => decrypt(key, header, aad)).toThrow(DecryptionError);
  });

  it("rejects unknown format versions and short input", () => {
    const blob = encrypt(key, 1, Buffer.from("x"), aad);
    blob[0] = 9;
    expect(() => decrypt(key, blob, aad)).toThrow(/format version/);
    expect(() => decrypt(key, Buffer.alloc(5), aad)).toThrow(DecryptionError);
  });

  it("handles empty and large plaintext", () => {
    expect(decrypt(key, encrypt(key, 1, Buffer.alloc(0), aad), aad).length).toBe(0);
    const big = randomBytes(2 * 1024 * 1024);
    expect(decrypt(key, encrypt(key, 1, big, aad), aad).equals(big)).toBe(true);
  });
});

describe("key provider", () => {
  const provider = new LocalKeyProvider(randomBytes(32));

  it("wraps and unwraps a user key", async () => {
    const udk = generateUserDataKey();
    const wrapped = await provider.wrap(udk, "user-a");
    expect(wrapped.includes(udk)).toBe(false);
    expect((await provider.unwrap(wrapped, "user-a")).equals(udk)).toBe(true);
  });

  it("binds the wrapped key to its user", async () => {
    const wrapped = await provider.wrap(generateUserDataKey(), "user-a");
    await expect(provider.unwrap(wrapped, "user-b")).rejects.toThrow(DecryptionError);
  });

  it("cannot unwrap with a different master key", async () => {
    const wrapped = await provider.wrap(generateUserDataKey(), "user-a");
    const other = new LocalKeyProvider(randomBytes(32));
    await expect(other.unwrap(wrapped, "user-a")).rejects.toThrow(DecryptionError);
    expect(other.id).not.toBe(provider.id);
  });

  it("refuses master keys of the wrong length", () => {
    expect(() => new LocalKeyProvider(randomBytes(16))).toThrow();
  });
});

describe("encrypted fields", () => {
  const udk = generateUserDataKey();
  const alice = deriveUserKeys("alice", 1, udk);
  const ctx = { table: "entries", column: "body_enc", rowId: "row-1" };

  it("derives distinct encryption and search keys", () => {
    expect(alice.encKey.equals(alice.searchKey)).toBe(false);
  });

  it("round-trips text and JSON, including Urdu", () => {
    const text = "آج کا دن بہت اچھا تھا — today was a good day";
    expect(openText(alice, ctx, sealText(alice, ctx, text))).toBe(text);
    const doc = { type: "doc", content: [{ type: "paragraph" }] };
    expect(openJson(alice, ctx, sealJson(alice, ctx, doc))).toEqual(doc);
  });

  it("cannot be moved to another row, column, or user", () => {
    const blob = sealText(alice, ctx, "private");
    expect(() => openText(alice, { ...ctx, rowId: "row-2" }, blob)).toThrow(DecryptionError);
    expect(() => openText(alice, { ...ctx, column: "title_enc" }, blob)).toThrow(DecryptionError);
    const mallory = deriveUserKeys("mallory", 1, udk); // even with the same key material
    expect(() => openText(mallory, ctx, blob)).toThrow(DecryptionError);
  });
});

describe("blind index", () => {
  const key = randomBytes(32);

  it("normalizes case and diacritics", () => {
    expect(normalize("Café ÉTÉ")).toBe("cafe ete");
    expect(words("Hello, World! 2026")).toEqual(["hello", "world", "2026"]);
  });

  it("tokenizes non-Latin scripts", () => {
    expect(words("یادداشت اچھی ہے")).toEqual(["یادداشت", "اچھی", "ہے"]);
  });

  it("indexes words and typing prefixes", () => {
    const terms = indexTerms("Learning");
    expect(terms.has("w:learning")).toBe(true);
    expect(terms.has("p:lea")).toBe(true);
    expect(terms.has("p:le")).toBe(false);
  });

  it("matches the last query word as a prefix", () => {
    expect(queryTerms("ai age")).toEqual(["w:ai", "p:age"]);
    expect(queryTerms("ai agents ")).toEqual(["w:ai", "w:agents"]);
    const indexed = indexTerms("Notes about AI agents");
    for (const t of queryTerms("ai age")) expect(indexed.has(t)).toBe(true);
  });

  it("produces per-user, fixed-size opaque tokens", () => {
    const a = blindToken(key, "w:diary");
    expect(a.length).toBe(16);
    expect(blindToken(key, "w:diary").equals(a)).toBe(true);
    expect(blindToken(randomBytes(32), "w:diary").equals(a)).toBe(false);
  });
});

describe("uuidv7", () => {
  it("is a valid, time-ordered v7 UUID", () => {
    const a = uuidv7(1_000);
    const b = uuidv7(2_000);
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(a < b).toBe(true);
  });
});
