import { decrypt, encrypt } from "./envelope";
import type { UserKeys } from "./keys";

/** Where a ciphertext lives. Bound into the associated data. */
export type FieldContext = {
  table: string;
  column: string;
  rowId: string;
};

function aad(keys: UserKeys, ctx: FieldContext) {
  return Buffer.from(`yaadasht:v1:${ctx.table}:${ctx.column}:${ctx.rowId}:${keys.userId}`, "utf8");
}

export function sealText(keys: UserKeys, ctx: FieldContext, text: string): Buffer {
  return encrypt(keys.encKey, keys.keyVersion, Buffer.from(text, "utf8"), aad(keys, ctx));
}

export function openText(keys: UserKeys, ctx: FieldContext, blob: Buffer): string {
  return decrypt(keys.encKey, blob, aad(keys, ctx)).toString("utf8");
}

export function sealJson(keys: UserKeys, ctx: FieldContext, value: unknown): Buffer {
  return sealText(keys, ctx, JSON.stringify(value));
}

export function openJson<T>(keys: UserKeys, ctx: FieldContext, blob: Buffer): T {
  return JSON.parse(openText(keys, ctx, blob)) as T;
}

export function openTextOrNull(keys: UserKeys, ctx: FieldContext, blob: Buffer | null): string | null {
  return blob ? openText(keys, ctx, blob) : null;
}
