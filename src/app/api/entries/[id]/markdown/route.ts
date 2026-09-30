import { docToMarkdown } from "@/lib/doc";
import { listCollections } from "@/server/collections";
import { getEntry } from "@/server/entries";
import { requireUser } from "@/server/users";

/** Download one memory as a Markdown file with YAML front matter. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser();
  if (!/^[0-9a-f-]{36}$/.test(id)) return new Response("Not found", { status: 404 });
  const [entry, collections] = await Promise.all([getEntry(user.id, id), listCollections(user.id)]);
  if (!entry) return new Response("Not found", { status: 404 });

  const collection = collections.find((c) => c.id === entry.collectionId)?.name ?? "";
  const yaml = (s: string) => JSON.stringify(s);
  const front = [
    "---",
    `title: ${yaml(entry.title ?? "")}`,
    `date: ${entry.memoryDate}`,
    `collection: ${yaml(collection)}`,
    `tags: [${entry.tags.map(yaml).join(", ")}]`,
    `exported_from: Yaadasht`,
    "---",
    "",
  ].join("\n");
  const heading = entry.title ? `# ${entry.title}\n\n` : "";
  const body = front + heading + docToMarkdown(entry.body) + "\n";

  const slug = (entry.title ?? "memory")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || "memory";

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${entry.memoryDate}-${encodeURIComponent(slug)}.md"`,
      "Cache-Control": "private, no-store",
    },
  });
}
