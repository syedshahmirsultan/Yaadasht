"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import type { AttachmentView } from "@/server/attachments";
import { finishUploadAction, startUploadAction } from "@/server/actions";

export type UploadItem = {
  key: string;
  name: string;
  kind: "image" | "video" | "audio" | "file";
  previewUrl: string | null;
  progress: number;
  error?: string;
};

const MAX_VIDEO_SECONDS = 600;

function kindOf(type: string): UploadItem["kind"] {
  if (type.startsWith("image/") && type !== "image/svg+xml") return "image";
  if (type.startsWith("video/")) return "video";
  if (type.startsWith("audio/")) return "audio";
  return "file";
}

function formatMB(bytes: number) {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

/** Reads dimensions and duration in the browser, without uploading anything. */
async function probe(file: File, kind: UploadItem["kind"], url: string) {
  const meta: { width?: number; height?: number; durationSec?: number } = {};
  if (kind === "image") {
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.onload = () => {
        meta.width = img.naturalWidth;
        meta.height = img.naturalHeight;
        resolve();
      };
      img.onerror = () => resolve();
      img.src = url;
    });
  } else if (kind === "video" || kind === "audio") {
    await new Promise<void>((resolve) => {
      const el = document.createElement(kind === "video" ? "video" : "audio");
      el.preload = "metadata";
      el.onloadedmetadata = () => {
        if (Number.isFinite(el.duration)) meta.durationSec = Math.round(el.duration * 10) / 10;
        if (el instanceof HTMLVideoElement && el.videoWidth) {
          meta.width = el.videoWidth;
          meta.height = el.videoHeight;
        }
        resolve();
      };
      el.onerror = () => resolve();
      el.src = url;
    });
  }
  return meta;
}

function putWithProgress(url: string, file: File, onProgress: (p: number) => void) {
  return new Promise<void>((resolve, reject) => {
    const body = new FormData();
    body.append("cacheControl", "3600");
    body.append("", file);
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`status ${xhr.status}`)));
    xhr.onerror = () => reject(new Error("network"));
    xhr.send(body);
  });
}

const reasons = (maxBytes: number): Record<string, string> => ({
  "too-large": `is larger than ${formatMB(maxBytes)}, the current limit per file.`,
  "too-long": "is longer than 10 minutes. You could trim it and try again.",
  quota: "doesn't fit in your remaining storage.",
  "too-many": "can't be added: a memory can hold up to 50 files.",
  "not-configured": "can't be uploaded yet: file storage isn't set up on this server.",
  "not-found": "couldn't be attached because the memory wasn't found.",
  invalid: "couldn't be read.",
});

/**
 * Uploads files straight from the browser to storage, with progress.
 * `ensureEntry` must return the memory's id (saving it first if needed).
 */
export function useUploads({
  ensureEntry,
  onUploaded,
  maxBytes,
}: {
  ensureEntry: () => Promise<string | null>;
  onUploaded: (a: AttachmentView) => void;
  maxBytes: number;
}) {
  const REASONS = useMemo(() => reasons(maxBytes), [maxBytes]);
  const [items, setItems] = useState<UploadItem[]>([]);

  const patch = (key: string, p: Partial<UploadItem>) =>
    setItems((list) => list.map((i) => (i.key === key ? { ...i, ...p } : i)));
  const drop = (key: string) =>
    setItems((list) => {
      const it = list.find((i) => i.key === key);
      if (it?.previewUrl) URL.revokeObjectURL(it.previewUrl);
      return list.filter((i) => i.key !== key);
    });

  const upload = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return;
      const entryId = await ensureEntry();
      if (!entryId) return;

      await Promise.all(
        files.map(async (file) => {
          const key = `${file.name}-${file.size}-${Math.random().toString(36).slice(2)}`;
          const kind = kindOf(file.type);
          const previewUrl = kind === "image" || kind === "video" ? URL.createObjectURL(file) : null;
          setItems((list) => [...list, { key, name: file.name, kind, previewUrl, progress: 0 }]);

          // Errors stay visible on the tile and also appear as a notification.
          const fail = (msg: string) => {
            patch(key, { error: msg });
            toast.error(msg, { duration: 10000 });
            setTimeout(() => drop(key), 12000);
          };

          if (file.size > maxBytes) return fail(`"${file.name}" ${REASONS["too-large"]}`);
          const meta = await probe(file, kind, previewUrl ?? URL.createObjectURL(file));
          if (kind === "video" && (meta.durationSec ?? 0) > MAX_VIDEO_SECONDS) return fail(`"${file.name}" ${REASONS["too-long"]}`);

          try {
            const start = await startUploadAction({
              entryId,
              filename: file.name,
              mimeType: file.type || "application/octet-stream",
              sizeBytes: file.size,
              meta,
            });
            if (!start.ok) return fail(`"${file.name}" ${REASONS[start.reason] ?? "couldn't be uploaded."}`);
            await putWithProgress(start.uploadUrl, file, (p) => patch(key, { progress: p }));
            patch(key, { progress: 1 });
            const view = await finishUploadAction(start.attachmentId);
            if (!view) return fail(`"${file.name}" didn't arrive completely. Please try again.`);
            onUploaded(view);
            drop(key);
          } catch {
            fail(`"${file.name}" couldn't be uploaded. Check your connection and try again.`);
          }
        }),
      );
    },
    [ensureEntry, onUploaded, maxBytes, REASONS],
  );

  return { items, upload };
}
