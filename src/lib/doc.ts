import { z } from "zod";

/**
 * Memories are stored as ProseMirror/Tiptap JSON (encrypted). These helpers
 * validate that JSON and turn it into plain text (for search and excerpts)
 * and Markdown (for downloads and export).
 */

export type Mark = { type: string; attrs?: Record<string, unknown> };
export type DocNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: DocNode[];
  text?: string;
  marks?: Mark[];
};

const NODE_TYPES = [
  "doc",
  "paragraph",
  "text",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "codeBlock",
  "horizontalRule",
  "hardBreak",
] as const;
const MARK_TYPES = ["bold", "italic", "strike", "underline", "code", "link"] as const;

const markSchema = z
  .object({
    type: z.enum(MARK_TYPES),
    attrs: z.record(z.string(), z.unknown()).optional(),
  })
  .strip();

export const docNodeSchema: z.ZodType<DocNode> = z.lazy(() =>
  z
    .object({
      type: z.enum(NODE_TYPES),
      attrs: z.record(z.string(), z.unknown()).optional(),
      content: z.array(docNodeSchema).max(20_000).optional(),
      text: z.string().max(200_000).optional(),
      marks: z.array(markSchema).max(10).optional(),
    })
    .strip(),
);

export const docSchema = docNodeSchema.refine((d) => d.type === "doc", "Not a document");

export const EMPTY_DOC: DocNode = { type: "doc", content: [{ type: "paragraph" }] };

export function docFromPrompt(prompt: string | undefined): DocNode {
  if (!prompt) return EMPTY_DOC;
  return {
    type: "doc",
    content: [
      { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: prompt }] },
      { type: "paragraph" },
    ],
  };
}

const BLOCKS = new Set(["paragraph", "heading", "listItem", "blockquote", "codeBlock", "horizontalRule"]);

/** Plain text, with line breaks between blocks. */
export function docToText(node: DocNode): string {
  if (node.type === "text") return node.text ?? "";
  if (node.type === "hardBreak") return "\n";
  const inner = (node.content ?? []).map(docToText).join("");
  return BLOCKS.has(node.type) ? `${inner}\n` : inner;
}

export function wordCount(text: string): number {
  return (text.match(/[\p{L}\p{N}]+/gu) ?? []).length;
}

export function excerptOf(text: string, max = 220): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max).replace(/\s+\S*$/, "")}…`;
}

function inlineMarkdown(nodes: DocNode[] = []): string {
  return nodes
    .map((n) => {
      if (n.type === "hardBreak") return "  \n";
      let t = n.text ?? "";
      for (const m of n.marks ?? []) {
        if (m.type === "bold") t = `**${t}**`;
        else if (m.type === "italic") t = `*${t}*`;
        else if (m.type === "strike") t = `~~${t}~~`;
        else if (m.type === "code") t = `\`${t}\``;
        else if (m.type === "link" && typeof m.attrs?.href === "string") t = `[${t}](${m.attrs.href})`;
      }
      return t;
    })
    .join("");
}

function blockMarkdown(node: DocNode, indent = ""): string {
  switch (node.type) {
    case "doc":
      return (node.content ?? []).map((n) => blockMarkdown(n)).join("\n\n");
    case "paragraph":
      return indent + inlineMarkdown(node.content);
    case "heading":
      return `${"#".repeat(Math.min(6, Number(node.attrs?.level ?? 2)))} ${inlineMarkdown(node.content)}`;
    case "blockquote":
      return (node.content ?? []).map((n) => blockMarkdown(n).replace(/^/gm, "> ")).join("\n>\n");
    case "codeBlock":
      return "```\n" + (node.content ?? []).map((n) => n.text ?? "").join("") + "\n```";
    case "horizontalRule":
      return "---";
    case "bulletList":
      return (node.content ?? []).map((li) => listItem(li, `${indent}- `, indent)).join("\n");
    case "orderedList":
      return (node.content ?? []).map((li, i) => listItem(li, `${indent}${i + 1}. `, indent)).join("\n");
    default:
      return inlineMarkdown(node.content);
  }
}

function listItem(li: DocNode, bullet: string, indent: string): string {
  const [first, ...rest] = li.content ?? [];
  const head = bullet + (first ? blockMarkdown(first).trimStart() : "");
  const tail = rest.map((n) => blockMarkdown(n, `${indent}  `)).join("\n");
  return tail ? `${head}\n${tail}` : head;
}

export function docToMarkdown(doc: DocNode): string {
  return blockMarkdown(doc).replace(/\n{3,}/g, "\n\n").trim();
}
