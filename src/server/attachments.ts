import "server-only";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { uuidv7 } from "@/lib/id";
import { openJson, openText, sealJson, sealText } from "@/server/crypto/fields";
import { getUserKeys } from "@/server/crypto/userKeys";
import { getDb } from "@/server/db";
import { attachments, entries, users, type AttachmentKind } from "@/server/db/schema";
import { createUploadUrl, objectSize, removeObjects, signedUrls, uploadMaxBytes } from "@/server/storage";

/**
 * Photos, videos and files attached to memories. Filenames, types and
 * dimensions are encrypted in the database; storage keys contain only IDs.
 */

export type AttachmentMeta = { width?: number; height?: number; durationSec?: number };

export type AttachmentView = {
  id: string;
  kind: AttachmentKind;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  meta: AttachmentMeta;
  url: string | null;
  previewUrl: string | null;
  downloadUrl: string | null;
};

const ctx = (id: string, column: string) => ({ table: "attachments", column, rowId: id });

export const VIDEO_MAX_SECONDS = Number(process.env.VIDEO_MAX_SECONDS ?? 600);

export function kindFor(mime: string): AttachmentKind {
  if (mime.startsWith("image/") && mime !== "image/svg+xml") return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "file";
}

export type StartUploadInput = {
  entryId: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  meta: AttachmentMeta;
  hasPreview?: boolean;
};

export type StartUploadResult =
  | { ok: true; attachmentId: string; uploadUrl: string; previewUploadUrl?: string }
  | { ok: false; reason: "too-large" | "too-long" | "quota" | "not-found" | "too-many" };

export async function startUpload(userId: string, input: StartUploadInput): Promise<StartUploadResult> {
  const db = getDb();
  if (input.sizeBytes > uploadMaxBytes()) return { ok: false, reason: "too-large" };
  const kind = kindFor(input.mimeType);
  if (kind === "video" && (input.meta.durationSec ?? 0) > VIDEO_MAX_SECONDS) return { ok: false, reason: "too-long" };

  const entry = await db.query.entries.findFirst({ where: and(eq(entries.id, input.entryId), eq(entries.userId, userId)) });
  if (!entry) return { ok: false, reason: "not-found" };

  const [{ n }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(attachments)
    .where(eq(attachments.entryId, input.entryId));
  if (n >= 50) return { ok: false, reason: "too-many" };

  // Reserve quota up front so parallel uploads can't exceed it.
  const reserved = await db
    .update(users)
    .set({ storageUsedBytes: sql`${users.storageUsedBytes} + ${input.sizeBytes}` })
    .where(and(eq(users.id, userId), sql`${users.storageUsedBytes} + ${input.sizeBytes} <= ${users.storageQuotaBytes}`))
    .returning({ id: users.id });
  if (reserved.length === 0) return { ok: false, reason: "quota" };

  const keys = await getUserKeys(userId);
  const id = uuidv7();
  const objectKey = `u/${userId}/${id}`;
  try {
    const uploadUrl = await createUploadUrl(objectKey);
    const previewUploadUrl = kind === "video" && input.hasPreview ? await createUploadUrl(`${objectKey}.preview`) : undefined;
    await db.insert(attachments).values({
      id,
      userId,
      entryId: input.entryId,
      kind,
      objectKey,
      filenameEnc: sealText(keys, ctx(id, "filename_enc"), input.filename.slice(0, 200)),
      mimeTypeEnc: sealText(keys, ctx(id, "mime_type_enc"), input.mimeType.slice(0, 120)),
      metaEnc: sealJson(keys, ctx(id, "meta_enc"), input.meta),
      sizeBytes: input.sizeBytes,
      position: n,
    });
    return { ok: true, attachmentId: id, uploadUrl, previewUploadUrl };
  } catch (e) {
    await releaseQuota(userId, input.sizeBytes);
    throw e;
  }
}

async function releaseQuota(userId: string, bytes: number) {
  await getDb()
    .update(users)
    .set({ storageUsedBytes: sql`greatest(0, ${users.storageUsedBytes} - ${bytes})` })
    .where(eq(users.id, userId));
}

/** Confirms the file really arrived and matches what was declared. */
export async function finishUpload(userId: string, attachmentId: string): Promise<AttachmentView | null> {
  const db = getDb();
  const row = await db.query.attachments.findFirst({
    where: and(eq(attachments.id, attachmentId), eq(attachments.userId, userId)),
  });
  if (!row) return null;
  const size = await objectSize(row.objectKey);
  if (size === null || size > uploadMaxBytes()) {
    await discard(userId, [row]);
    return null;
  }
  if (size !== row.sizeBytes) {
    await db
      .update(users)
      .set({ storageUsedBytes: sql`greatest(0, ${users.storageUsedBytes} + ${size - row.sizeBytes})` })
      .where(eq(users.id, userId));
  }
  await db.update(attachments).set({ status: "ready", sizeBytes: size }).where(eq(attachments.id, row.id));
  await db.update(entries).set({ hasMedia: true }).where(eq(entries.id, row.entryId));
  const [view] = await toViews(userId, [{ ...row, status: "ready", sizeBytes: size }]);
  return view;
}

type Row = typeof attachments.$inferSelect;

async function toViews(userId: string, rows: Row[]): Promise<AttachmentView[]> {
  if (rows.length === 0) return [];
  const keys = await getUserKeys(userId);
  const decoded = rows.map((r) => ({
    row: r,
    filename: openText(keys, ctx(r.id, "filename_enc"), r.filenameEnc),
    mimeType: openText(keys, ctx(r.id, "mime_type_enc"), r.mimeTypeEnc),
    meta: r.metaEnc ? openJson<AttachmentMeta>(keys, ctx(r.id, "meta_enc"), r.metaEnc) : {},
  }));
  const urls = await signedUrls(decoded.flatMap((d) => [
    { key: d.row.objectKey },
    { key: d.row.objectKey, downloadName: d.filename },
    ...(d.row.kind === "video" ? [{ key: `${d.row.objectKey}.preview` }] : []),
  ]));
  return decoded.map((d) => ({
    id: d.row.id,
    kind: d.row.kind,
    filename: d.filename,
    mimeType: d.mimeType,
    sizeBytes: d.row.sizeBytes,
    meta: d.meta,
    url: urls.get(d.row.objectKey) ?? null,
    previewUrl: d.row.kind === "video" ? urls.get(`${d.row.objectKey}.preview`) ?? null : null,
    downloadUrl: urls.get(`${d.row.objectKey}#download`) ?? null,
  }));
}

export async function listAttachments(userId: string, entryId: string): Promise<AttachmentView[]> {
  const rows = await getDb()
    .select()
    .from(attachments)
    .where(and(eq(attachments.userId, userId), eq(attachments.entryId, entryId), eq(attachments.status, "ready")))
    .orderBy(asc(attachments.position), asc(attachments.createdAt));
  return toViews(userId, rows);
}

export async function listAttachmentsForEntries(userId: string, entryIds: string[]): Promise<Map<string, AttachmentView[]>> {
  const result = new Map<string, AttachmentView[]>();
  if (entryIds.length === 0) return result;
  const rows = await getDb()
    .select()
    .from(attachments)
    .where(and(eq(attachments.userId, userId), inArray(attachments.entryId, entryIds), eq(attachments.status, "ready")))
    .orderBy(asc(attachments.position), asc(attachments.createdAt));
  const views = await toViews(userId, rows);
  rows.forEach((row, index) => result.set(row.entryId, [...(result.get(row.entryId) ?? []), views[index]]));
  return result;
}

async function discard(userId: string, rows: Row[]) {
  if (rows.length === 0) return;
  await removeObjects(rows.flatMap((r) => (r.kind === "video" ? [r.objectKey, `${r.objectKey}.preview`] : [r.objectKey])));
  await getDb()
    .delete(attachments)
    .where(inArray(attachments.id, rows.map((r) => r.id)));
  await releaseQuota(userId, rows.reduce((n, r) => n + r.sizeBytes, 0));
}

export async function deleteAttachment(userId: string, attachmentId: string): Promise<boolean> {
  const row = await getDb().query.attachments.findFirst({
    where: and(eq(attachments.id, attachmentId), eq(attachments.userId, userId)),
  });
  if (!row) return false;
  await discard(userId, [row]);
  const [{ n }] = await getDb()
    .select({ n: sql<number>`count(*)::int` })
    .from(attachments)
    .where(eq(attachments.entryId, row.entryId));
  if (n === 0) await getDb().update(entries).set({ hasMedia: false }).where(eq(entries.id, row.entryId));
  return true;
}

/** Called before memories are deleted forever: removes their files from storage and frees quota. */
export async function discardForEntries(userId: string, entryIds: string[]) {
  if (entryIds.length === 0) return;
  const rows = await getDb()
    .select()
    .from(attachments)
    .where(and(eq(attachments.userId, userId), inArray(attachments.entryId, entryIds)));
  await discard(userId, rows);
}

/** How many photos/videos/files each memory has, for cards. */
export async function attachmentCounts(userId: string, entryIds: string[]): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  if (entryIds.length === 0) return map;
  const rows = await getDb()
    .select({ entryId: attachments.entryId, n: sql<number>`count(*)::int` })
    .from(attachments)
    .where(and(eq(attachments.userId, userId), inArray(attachments.entryId, entryIds), eq(attachments.status, "ready")))
    .groupBy(attachments.entryId);
  for (const r of rows) map.set(r.entryId, r.n);
  return map;
}
