import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Object storage for photos, videos and files.
 *
 * Browsers upload straight to storage with a one-time signed URL, so large
 * files never pass through our servers. The bucket is private: files are
 * only reachable through short-lived signed URLs we issue to their owner.
 * Implemented with Supabase Storage; the interface is small so an
 * S3-compatible provider (e.g. Cloudflare R2) can replace it later.
 */

export const BUCKET = "yaadasht-media";
export const DOWNLOAD_URL_SECONDS = 5 * 60;

export function uploadMaxBytes(): number {
  return Number(process.env.UPLOAD_MAX_BYTES ?? 50 * 1024 * 1024);
}

export function storageConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

let client: SupabaseClient | undefined;
let bucketReady: Promise<void> | undefined;

function supabase(): SupabaseClient {
  if (!storageConfigured()) throw new Error("storage_not_configured");
  client ??= createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

/** Creates the private bucket on first use. */
async function ensureBucket() {
  bucketReady ??= (async () => {
    const s = supabase().storage;
    const { data } = await s.getBucket(BUCKET);
    if (data) return;
    const { error } = await s.createBucket(BUCKET, { public: false, fileSizeLimit: uploadMaxBytes() });
    if (error && !/already exists/i.test(error.message)) {
      bucketReady = undefined;
      throw new Error(`bucket_create_failed: ${error.message}`);
    }
  })();
  return bucketReady;
}

export async function createUploadUrl(key: string): Promise<string> {
  await ensureBucket();
  const { data, error } = await supabase().storage.from(BUCKET).createSignedUploadUrl(key);
  if (error || !data) throw new Error("upload_url_failed");
  return data.signedUrl;
}

/** Actual stored size, or null if the object isn't there. */
export async function objectSize(key: string): Promise<number | null> {
  const { data, error } = await supabase().storage.from(BUCKET).info(key);
  if (error || !data) return null;
  return typeof data.size === "number" ? data.size : null;
}

export async function signedUrls(
  items: { key: string; downloadName?: string }[],
): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (items.length === 0 || !storageConfigured()) return out;
  const s = supabase().storage.from(BUCKET);
  await Promise.all(
    items.map(async ({ key, downloadName }) => {
      const { data } = await s.createSignedUrl(key, DOWNLOAD_URL_SECONDS, downloadName ? { download: downloadName } : undefined);
      if (data?.signedUrl) out.set(downloadName ? `${key}#download` : key, data.signedUrl);
    }),
  );
  return out;
}

export async function removeObjects(keys: string[]) {
  if (keys.length === 0 || !storageConfigured()) return;
  for (let i = 0; i < keys.length; i += 100) {
    await supabase().storage.from(BUCKET).remove(keys.slice(i, i + 100));
  }
}
