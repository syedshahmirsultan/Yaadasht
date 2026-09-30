import { describe, expect, it } from "vitest";
import { docFromPrompt, docSchema, docToMarkdown, docToText, excerptOf, wordCount } from "@/lib/doc";

const doc = {
  type: "doc",
  content: [
    { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "A day" }] },
    {
      type: "paragraph",
      content: [
        { type: "text", text: "Plain, " },
        { type: "text", text: "bold", marks: [{ type: "bold" }] },
        { type: "text", text: " and " },
        { type: "text", text: "a link", marks: [{ type: "link", attrs: { href: "https://example.com" } }] },
      ],
    },
    { type: "bulletList", content: [{ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "one" }] }] }] },
    { type: "blockquote", content: [{ type: "paragraph", content: [{ type: "text", text: "quoted" }] }] },
  ],
};

describe("document helpers", () => {
  it("accepts valid documents and rejects unknown node types", () => {
    expect(docSchema.safeParse(doc).success).toBe(true);
    expect(docSchema.safeParse({ type: "doc", content: [{ type: "script", text: "x" }] }).success).toBe(false);
    expect(docSchema.safeParse({ type: "paragraph" }).success).toBe(false);
  });

  it("strips unexpected fields", () => {
    const parsed = docSchema.parse({ type: "doc", content: [{ type: "paragraph", onclick: "evil" }] });
    expect(JSON.stringify(parsed)).not.toContain("evil");
  });

  it("extracts text, excerpt and word count", () => {
    const text = docToText(doc);
    expect(text).toContain("A day");
    expect(text).toContain("bold and a link");
    expect(wordCount(text)).toBe(9);
    expect(excerptOf("word ".repeat(100), 30).endsWith("…")).toBe(true);
  });

  it("converts to Markdown", () => {
    const md = docToMarkdown(doc);
    expect(md).toContain("## A day");
    expect(md).toContain("**bold**");
    expect(md).toContain("[a link](https://example.com)");
    expect(md).toContain("- one");
    expect(md).toContain("> quoted");
  });

  it("starts a page from a prompt", () => {
    expect(docToText(docFromPrompt("How was your day?"))).toContain("How was your day?");
  });
});
