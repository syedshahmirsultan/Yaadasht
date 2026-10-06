import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import sharp from "sharp";
import { docToMarkdown, docToText } from "@/lib/doc";
import { formatMemoryDate } from "@/lib/format";
import { listAttachmentsForEntries, type AttachmentView } from "@/server/attachments";
import { getCollection, listCollections } from "@/server/collections";
import { getEntry, listEntries, type EntryFull } from "@/server/entries";
import { storageConfigured } from "@/server/storage";
import { requireUser } from "@/server/users";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 54;
const BODY_SIZE = 11;
const BODY_LEADING = 17;

function safePdfText(value: string) {
  return value.replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/[\u2013\u2014]/g, "-").replace(/[^\x20-\x7e\u00a0-\u00ff]/g, "?");
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of safePdfText(text).split("\n")) {
    if (!paragraph) {
      lines.push("");
      continue;
    }
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

async function fetchImageBytes(url: string | null) {
  if (!url) return null;
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}

async function normalizedJpeg(url: string | null) {
  const bytes = await fetchImageBytes(url);
  if (!bytes) return null;
  try {
    return await sharp(bytes, { limitInputPixels: 100_000_000 }).rotate().jpeg({ quality: 84 }).toBuffer();
  } catch {
    return null;
  }
}

function attachmentPreview(item: AttachmentView) {
  return item.kind === "image" ? item.url : item.kind === "video" ? item.previewUrl : null;
}

async function markdownContent(entries: EntryFull[], collections: Map<string, string>, media: Map<string, AttachmentView[]>, collectionName?: string) {
  const date = new Date().toISOString().slice(0, 10);
  let content = `# ${collectionName ? `${collectionName} Collection` : "Yaadasht Archive"}\n\nExported on: ${date}\nTotal memories: ${entries.length}\n\n`;

  for (const entry of entries) {
    content += `---\n\n## ${entry.title || "Untitled Memory"}\n\n`;
    content += `- **Date:** ${formatMemoryDate(entry.memoryDate, "long")}\n`;
    content += `- **Collection:** ${collections.get(entry.collectionId) ?? "General"}\n`;
    if (entry.tags.length) content += `- **Tags:** ${entry.tags.join(", ")}\n`;
    content += `\n${docToMarkdown(entry.body)}\n`;

    for (const item of media.get(entry.id) ?? []) {
      const bytes = await normalizedJpeg(attachmentPreview(item));
      if (bytes) content += `\n![${item.filename}](data:image/jpeg;base64,${bytes.toString("base64")})\n`;
      if (item.kind === "video") content += `\n**Video:** ${item.filename}\n`;
      else if (item.kind !== "image") content += `\n**Attachment (${item.kind}):** ${item.filename} (${Math.ceil(item.sizeBytes / 1024)} KB)\n`;
    }
    content += "\n";
  }
  return { content, date };
}

async function pdfContent(entries: EntryFull[], collections: Map<string, string>, media: Map<string, AttachmentView[]>, collectionName?: string) {
  const pdf = await PDFDocument.create();
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const date = new Date().toISOString().slice(0, 10);

  for (const entry of entries) {
    let page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    let y = PAGE_HEIGHT - MARGIN;
    const collection = collections.get(entry.collectionId) ?? collectionName ?? "General";
    const addPage = () => {
      page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
      page.drawText(safePdfText(`${collection} - ${formatMemoryDate(entry.memoryDate, "long")} (continued)`), {
        x: MARGIN, y, size: 9, font: regular, color: rgb(0.38, 0.4, 0.45),
      });
      y -= 30;
    };

    page.drawText(safePdfText(collectionName ?? collection), { x: MARGIN, y, size: 10, font: bold, color: rgb(0.74, 0.31, 0.03) });
    y -= 29;
    for (const line of wrapText(entry.title || "Untitled Memory", bold, 23, PAGE_WIDTH - MARGIN * 2)) {
      page.drawText(line, { x: MARGIN, y, size: 23, font: bold, color: rgb(0.08, 0.1, 0.15) });
      y -= 29;
    }
    const metadata = `${formatMemoryDate(entry.memoryDate, "long")}  |  ${collection}${entry.tags.length ? `  |  ${entry.tags.map((tag) => `#${tag}`).join(" ")}` : ""}`;
    for (const line of wrapText(metadata, regular, 9, PAGE_WIDTH - MARGIN * 2)) {
      page.drawText(line, { x: MARGIN, y, size: 9, font: regular, color: rgb(0.38, 0.4, 0.45) });
      y -= 15;
    }
    y -= 15;
    page.drawLine({ start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y }, thickness: 1, color: rgb(0.9, 0.89, 0.86) });
    y -= 22;

    for (const line of wrapText(docToText(entry.body).trim(), regular, BODY_SIZE, PAGE_WIDTH - MARGIN * 2)) {
      if (y < MARGIN + BODY_LEADING) addPage();
      if (line) page.drawText(line, { x: MARGIN, y, size: BODY_SIZE, font: regular, color: rgb(0.12, 0.14, 0.18) });
      y -= BODY_LEADING;
    }

    for (const item of media.get(entry.id) ?? []) {
      const image = await normalizedJpeg(attachmentPreview(item));
      if (image) {
        const embedded = await pdf.embedJpg(image);
        const maxWidth = PAGE_WIDTH - MARGIN * 2;
        const maxHeight = 310;
        const scale = Math.min(maxWidth / embedded.width, maxHeight / embedded.height, 1);
        const width = embedded.width * scale;
        const height = embedded.height * scale;
        if (y < height + MARGIN + 30) addPage();
        page.drawImage(embedded, { x: MARGIN, y: y - height, width, height });
        y -= height + 10;
      }
      const caption = item.kind === "video" ? `Video: ${item.filename}` : item.kind === "image" ? item.filename : `${item.kind}: ${item.filename} (${Math.ceil(item.sizeBytes / 1024)} KB)`;
      if (y < MARGIN + 15) addPage();
      page.drawText(safePdfText(caption), { x: MARGIN, y, size: 9, font: regular, color: rgb(0.38, 0.4, 0.45) });
      y -= 20;
    }
  }

  if (entries.length === 0) {
    const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    page.drawText(safePdfText(collectionName ?? "Yaadasht Archive"), { x: MARGIN, y: PAGE_HEIGHT - MARGIN, size: 22, font: bold });
    page.drawText(`No memories to export · ${date}`, { x: MARGIN, y: PAGE_HEIGHT - MARGIN - 35, size: 11, font: regular });
  }

  return { bytes: await pdf.save(), date };
}

/** Download an archive or one collection as a paginated PDF or Markdown document. */
export async function GET(req: Request) {
  const user = await requireUser();
  const url = new URL(req.url);
  const format = url.searchParams.get("format") ?? "pdf";
  const collectionId = url.searchParams.get("collectionId") ?? undefined;
  const collection = collectionId ? await getCollection(user.id, collectionId) : null;
  if (collectionId && !collection) return new Response("Not found", { status: 404 });

  const [cards, allCollections] = await Promise.all([
    (async () => {
      const result = [];
      let before: { date: string; id: string } | undefined;
      while (true) {
        const batch = await listEntries(user.id, { collectionId, limit: 200, before });
        result.push(...batch);
        if (batch.length < 200) return result;
        const last = batch.at(-1)!;
        before = { date: last.memoryDate, id: last.id };
      }
    })(),
    listCollections(user.id),
  ]);
  const entries = (await Promise.all(cards.map((card) => getEntry(user.id, card.id)))).filter((entry): entry is EntryFull => entry !== null);
  const collectionNames = new Map(allCollections.map((item) => [item.id, item.name]));
  const media = storageConfigured() ? await listAttachmentsForEntries(user.id, entries.map((entry) => entry.id)) : new Map();
  const baseName = collection ? collection.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "collection" : "yaadasht-archive";

  if (format === "markdown" || format === "md") {
    const { content, date } = await markdownContent(entries, collectionNames, media, collection?.name);
    return new Response(content, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${baseName}-${date}.md"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  if (format !== "pdf") return new Response("Unsupported export format", { status: 400 });
  const { bytes, date } = await pdfContent(entries, collectionNames, media, collection?.name);
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${baseName}-${date}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
