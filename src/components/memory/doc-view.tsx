import type { DocNode } from "@/lib/doc";

/**
 * Renders a memory's document as React elements. Never uses raw HTML, and
 * only allows http(s) and mailto links.
 */
function safeHref(href: unknown): string | undefined {
  if (typeof href !== "string") return undefined;
  try {
    const u = new URL(href);
    return ["http:", "https:", "mailto:"].includes(u.protocol) ? u.toString() : undefined;
  } catch {
    return undefined;
  }
}

function Text({ node }: { node: DocNode }) {
  let el: React.ReactNode = node.text ?? "";
  for (const m of node.marks ?? []) {
    if (m.type === "bold") el = <strong>{el}</strong>;
    else if (m.type === "italic") el = <em>{el}</em>;
    else if (m.type === "strike") el = <s>{el}</s>;
    else if (m.type === "underline") el = <u>{el}</u>;
    else if (m.type === "code") el = <code>{el}</code>;
    else if (m.type === "link") {
      const href = safeHref(m.attrs?.href);
      if (href) el = <a href={href} target="_blank" rel="noopener noreferrer nofollow">{el}</a>;
    }
  }
  return <>{el}</>;
}

function Node({ node }: { node: DocNode }) {
  const kids = (node.content ?? []).map((n, i) => <Node key={i} node={n} />);
  switch (node.type) {
    case "doc":
      return <>{kids}</>;
    case "paragraph":
      return <p>{kids}</p>;
    case "heading":
      return Number(node.attrs?.level) === 2 ? <h2>{kids}</h2> : <h3>{kids}</h3>;
    case "bulletList":
      return <ul>{kids}</ul>;
    case "orderedList":
      return <ol>{kids}</ol>;
    case "listItem":
      return <li>{kids}</li>;
    case "blockquote":
      return <blockquote>{kids}</blockquote>;
    case "codeBlock":
      return (
        <pre>
          <code>{kids}</code>
        </pre>
      );
    case "horizontalRule":
      return <hr />;
    case "hardBreak":
      return <br />;
    case "text":
      return <Text node={node} />;
    default:
      return null;
  }
}

export function DocView({ doc, className }: { doc: DocNode; className?: string }) {
  return (
    <div className={`memory-prose ${className ?? ""}`}>
      <Node node={doc} />
    </div>
  );
}
