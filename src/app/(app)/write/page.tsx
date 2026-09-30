import type { Metadata } from "next";
import { MemoryEditor } from "@/components/editor/memory-editor";
import { todayIn } from "@/lib/dates";
import { docFromPrompt } from "@/lib/doc";
import { listCollections } from "@/server/collections";
import { listTagNames } from "@/server/entries";
import { storageConfigured, uploadMaxBytes } from "@/server/storage";
import { requireUser } from "@/server/users";

export const metadata: Metadata = { title: "Write" };

export default async function WritePage({
  searchParams,
}: {
  searchParams: Promise<{ collection?: string; prompt?: string; date?: string }>;
}) {
  const user = await requireUser();
  const sp = await searchParams;
  const [collections, tagSuggestions] = await Promise.all([listCollections(user.id), listTagNames(user.id)]);
  const journal = collections.find((c) => c.kind === "journal") ?? collections[0];
  const chosen = collections.find((c) => c.id === sp.collection) ?? journal;
  const date = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : todayIn(user.timezone);
  const prompt = typeof sp.prompt === "string" ? sp.prompt.slice(0, 120) : undefined;

  return (
    <MemoryEditor
      initial={{ title: "", body: docFromPrompt(prompt), memoryDate: date, collectionId: chosen.id, tags: [] }}
      collections={collections}
      tagSuggestions={tagSuggestions}
      uploadMaxBytes={uploadMaxBytes()}
      storageReady={storageConfigured()}
    />
  );
}
