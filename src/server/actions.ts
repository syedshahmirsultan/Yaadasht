"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { docSchema } from "@/lib/doc";
import {
  COLLECTION_COLOR_KEYS,
  COLLECTION_ICON_KEYS,
  createCollection,
  deleteCollection,
  updateCollection,
} from "@/server/collections";
import {
  deleteAttachment,
  discardForEntries,
  finishUpload,
  listAttachments,
  startUpload,
  type AttachmentView,
  type StartUploadResult,
} from "@/server/attachments";
import {
  deleteForever,
  emptyTrash,
  moveToTrash,
  restoreFromTrash,
  saveEntry,
  trashedEntryIds,
  type SaveResult,
} from "@/server/entries";
import { storageConfigured } from "@/server/storage";
import { log } from "@/server/log";
import { requireUser } from "@/server/users";

/**
 * Every action re-checks the signed-in user and validates its input. Errors
 * are returned as short codes; memory content never appears in logs.
 */

const id = z.uuid();
const isoDate = z.iso.date();

const saveSchema = z.object({
  id: id.optional(),
  revision: z.number().int().positive().optional(),
  collectionId: id,
  memoryDate: isoDate,
  title: z.string().max(300),
  body: docSchema,
  tags: z.array(z.string().max(60)).max(30),
});

export async function saveEntryAction(input: unknown): Promise<SaveResult | { ok: false; reason: "invalid" }> {
  const parsed = saveSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  const user = await requireUser();
  try {
    return await saveEntry(user.id, parsed.data);
  } catch (e) {
    log.error("entry.save_failed", { error: e });
    throw new Error("save_failed");
  }
}

export async function trashEntryAction(entryId: string) {
  const user = await requireUser();
  await moveToTrash(user.id, id.parse(entryId));
  revalidatePath("/", "layout");
}

export async function restoreEntryAction(entryId: string) {
  const user = await requireUser();
  await restoreFromTrash(user.id, id.parse(entryId));
  revalidatePath("/", "layout");
}

export async function deleteForeverAction(entryId: string) {
  const user = await requireUser();
  const entry = id.parse(entryId);
  await discardForEntries(user.id, [entry]);
  await deleteForever(user.id, entry);
  revalidatePath("/trash");
}

export async function emptyTrashAction() {
  const user = await requireUser();
  await discardForEntries(user.id, await trashedEntryIds(user.id));
  await emptyTrash(user.id);
  revalidatePath("/trash");
}

const collectionSchema = z.object({
  name: z.string().trim().min(1).max(60),
  color: z.enum(COLLECTION_COLOR_KEYS),
  icon: z.enum(COLLECTION_ICON_KEYS),
});

export async function createCollectionAction(input: unknown): Promise<{ ok: true; id: string } | { ok: false }> {
  const parsed = collectionSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const user = await requireUser();
  const newId = await createCollection(user.id, parsed.data);
  revalidatePath("/", "layout");
  return { ok: true, id: newId };
}

export async function updateCollectionAction(collectionId: string, input: unknown): Promise<{ ok: boolean }> {
  const parsed = collectionSchema.partial().safeParse(input);
  if (!parsed.success) return { ok: false };
  const user = await requireUser();
  await updateCollection(user.id, id.parse(collectionId), parsed.data);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function deleteCollectionAction(collectionId: string) {
  const user = await requireUser();
  const result = await deleteCollection(user.id, id.parse(collectionId));
  if (result === "ok") revalidatePath("/", "layout");
  return result;
}


// ── Photos, videos and files ─────────────────────────────────────────────────

const uploadSchema = z.object({
  entryId: id,
  filename: z.string().min(1).max(200),
  mimeType: z.string().min(1).max(120),
  sizeBytes: z.number().int().positive(),
  hasPreview: z.boolean().optional(),
  meta: z
    .object({
      width: z.number().int().positive().max(100_000).optional(),
      height: z.number().int().positive().max(100_000).optional(),
      durationSec: z.number().nonnegative().max(100_000).optional(),
    })
    .strip(),
});

export async function startUploadAction(
  input: unknown,
): Promise<StartUploadResult | { ok: false; reason: "invalid" | "not-configured" }> {
  if (!storageConfigured()) return { ok: false, reason: "not-configured" };
  const parsed = uploadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, reason: "invalid" };
  const user = await requireUser();
  try {
    return await startUpload(user.id, parsed.data);
  } catch (e) {
    log.error("upload.start_failed", { error: e });
    throw new Error("upload_failed");
  }
}

export async function finishUploadAction(attachmentId: string): Promise<AttachmentView | null> {
  const user = await requireUser();
  return finishUpload(user.id, id.parse(attachmentId));
}

export async function listAttachmentsAction(entryId: string): Promise<AttachmentView[]> {
  const user = await requireUser();
  return listAttachments(user.id, id.parse(entryId));
}

export async function removeAttachmentAction(attachmentId: string): Promise<boolean> {
  const user = await requireUser();
  return deleteAttachment(user.id, id.parse(attachmentId));
}
