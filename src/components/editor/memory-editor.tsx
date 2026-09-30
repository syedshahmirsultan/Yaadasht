"use client";

import { CharacterCount, Placeholder } from "@tiptap/extensions";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import {
  ArrowLeft,
  Bold,
  Check,
  CloudOff,
  Heading2,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Lock,
  Quote,
  Strikethrough,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { DocNode } from "@/lib/doc";
import { cn } from "@/lib/utils";
import { AddMediaZone } from "@/components/media/add-media-zone";
import { AttachmentGallery } from "@/components/media/attachment-gallery";
import { useUploads } from "@/components/media/use-uploads";
import type { AttachmentView } from "@/server/attachments";
import { removeAttachmentAction, saveEntryAction } from "@/server/actions";
import { CollectionPicker, DatePill } from "./meta-pickers";
import { TagInput } from "./tag-input";

export type EditorCollection = { id: string; name: string; kind: string; color: string; icon: string };

export type MemoryEditorProps = {
  initial: {
    id?: string;
    revision?: number;
    title: string;
    body: DocNode;
    memoryDate: string;
    collectionId: string;
    tags: string[];
  };
  collections: EditorCollection[];
  tagSuggestions: string[];
  initialAttachments?: AttachmentView[];
  uploadMaxBytes: number;
  storageReady: boolean;
};

type Status = "idle" | "dirty" | "saving" | "saved" | "offline" | "conflict";

const PROMPTS = [
  "How was your day?",
  "What happened today?",
  "What did you learn?",
  "What are you thinking about?",
  "What are you grateful for?",
  "What should future you remember?",
];

export function MemoryEditor({
  initial,
  collections,
  tagSuggestions,
  initialAttachments = [],
  uploadMaxBytes,
  storageReady,
}: MemoryEditorProps) {
  const router = useRouter();
  const [title, setTitle] = useState(initial.title);
  const [memoryDate, setMemoryDate] = useState(initial.memoryDate);
  const [collectionId, setCollectionId] = useState(initial.collectionId);
  const [tags, setTags] = useState(initial.tags);
  const [status, setStatus] = useState<Status>(initial.id ? "saved" : "idle");
  const [words, setWords] = useState(0);
  const [isEmpty, setIsEmpty] = useState(true);

  // Refs hold the latest values so the debounced save never sends stale data.
  const idRef = useRef(initial.id);
  const revRef = useRef(initial.revision);
  const latest = useRef({ title, memoryDate, collectionId, tags });
  useEffect(() => {
    latest.current = { title, memoryDate, collectionId, tags };
  }, [title, memoryDate, collectionId, tags]);
  const saveRef = useRef<(force?: boolean) => Promise<void>>(async () => {});
  const editorRef = useRef<Editor | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);
  const again = useRef(false);


  const save = useCallback(async (force = false) => {
    const editor = editorRef.current;
    if (!editor) return;
    if (inFlight.current) {
      again.current = true;
      return;
    }
    const { title, memoryDate, collectionId, tags } = latest.current;
    // Nothing written yet: don't create an empty memory.
    if (!force && !idRef.current && editor.isEmpty && !title.trim()) {
      setStatus("idle");
      return;
    }
    inFlight.current = true;
    setStatus("saving");
    try {
      const res = await saveEntryAction({
        id: idRef.current,
        revision: revRef.current,
        title,
        memoryDate,
        collectionId,
        tags,
        body: editor.getJSON(),
      });
      if (res.ok) {
        const isNew = !idRef.current;
        idRef.current = res.id;
        revRef.current = res.revision;
        setStatus("saved");
        if (isNew) window.history.replaceState(null, "", `/m/${res.id}/edit`);
      } else if (res.reason === "conflict") {
        setStatus("conflict");
      } else {
        setStatus("offline");
        toast.error("We couldn't save this memory. Please check the date and collection.");
      }
    } catch {
      setStatus("offline");
      // Try again shortly; the words are still safely here on screen.
      timer.current = setTimeout(() => void saveRef.current(), 4000);
    } finally {
      inFlight.current = false;
      if (again.current) {
        again.current = false;
        void saveRef.current();
      }
    }
  }, []);
  useEffect(() => {
    saveRef.current = save;
  }, [save]);

  const scheduleSave = useCallback(() => {
    setStatus((s) => (s === "conflict" ? s : "dirty"));
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void save(), 900);
  }, [save]);

  // ── Photos, videos and files ──
  const [attachments, setAttachments] = useState<AttachmentView[]>(initialAttachments);
  const [dragging, setDragging] = useState(false);
  const ensureEntry = useCallback(async () => {
    if (idRef.current) return idRef.current;
    await saveRef.current(true);
    for (let i = 0; i < 100 && (inFlight.current || !idRef.current); i++) {
      if (!inFlight.current && !idRef.current) await saveRef.current(true);
      await new Promise((r) => setTimeout(r, 100));
    }
    return idRef.current ?? null;
  }, []);
  const onUploaded = useCallback((a: AttachmentView) => setAttachments((list) => [...list, a]), []);
  const { items: uploads, upload } = useUploads({ ensureEntry, onUploaded, maxBytes: uploadMaxBytes });
  const uploadRef = useRef(upload);
  useEffect(() => {
    uploadRef.current = upload;
  }, [upload]);
  function pickFiles(list: FileList | File[] | null) {
    if (!list || list.length === 0) return;
    if (!storageReady) {
      toast.error("Photos and files aren't available yet: file storage isn't set up on this server.");
      return;
    }
    void uploadRef.current(Array.from(list));
  }
  async function removeAttachment(id: string) {
    setAttachments((list) => list.filter((a) => a.id !== id));
    const ok = await removeAttachmentAction(id);
    if (!ok) toast.error("Couldn't remove that file. Please try again.");
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, autolink: true, defaultProtocol: "https", protocols: ["http", "https", "mailto"] },
      }),
      Placeholder.configure({ placeholder: "Write whatever you want to remember…" }),
      CharacterCount,
    ],
    content: initial.body,
    editorProps: {
      attributes: { class: "memory-prose min-h-[40vh] pb-10", "aria-label": "Memory" },
      // Pasting an image or file adds it to the memory.
      handleDrop: (_view, event) => {
        const files = Array.from((event as DragEvent).dataTransfer?.files ?? []);
        if (files.length === 0) return false;
        event.preventDefault();
        void uploadRef.current(files);
        return true;
      },
      handlePaste: (_view, event) => {
        const files = Array.from(event.clipboardData?.files ?? []);
        if (files.length === 0) return false;
        void uploadRef.current(files);
        return true;
      },
    },
    onCreate: ({ editor }) => {
      editorRef.current = editor;
      setWords(editor.storage.characterCount.words());
      setIsEmpty(editor.isEmpty);
    },
    onUpdate: ({ editor }) => {
      setWords(editor.storage.characterCount.words());
      setIsEmpty(editor.isEmpty);
      scheduleSave();
    },
  });

  // Metadata changes save too (skip the very first render).
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    scheduleSave();
  }, [title, memoryDate, collectionId, tags, scheduleSave]);

  // Warn before leaving with unsaved words; Ctrl/Cmd+S saves immediately.
  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (status === "dirty" || status === "saving" || status === "offline") e.preventDefault();
    };
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (timer.current) clearTimeout(timer.current);
        void save();
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("keydown", onKey);
    };
  }, [status, save]);

  async function done() {
    if (timer.current) clearTimeout(timer.current);
    await save();
    if (idRef.current) router.push(`/m/${idRef.current}`);
    else router.push("/today");
  }

  function insertPrompt(p: string) {
    editor
      ?.chain()
      .focus()
      .insertContent([
        { type: "heading", attrs: { level: 3 }, content: [{ type: "text", text: p }] },
        { type: "paragraph" },
      ])
      .run();
  }


  return (
    <div
      className="relative min-h-dvh"
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) {
          e.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setDragging(false);
      }}
      onDrop={(e) => {
        if (e.dataTransfer.files.length) {
          e.preventDefault();
          setDragging(false);
          pickFiles(e.dataTransfer.files);
        }
      }}
    >
      {dragging && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="animate-rise rounded-[1.75rem] border-2 border-dashed border-saffron bg-card px-10 py-8 text-center shadow-lift">
            <ImagePlus className="mx-auto size-8 text-saffron" />
            <p className="mt-3 font-serif text-2xl">Drop to add to this memory</p>
            <p className="mt-1 text-sm text-muted-foreground">Photos, videos and files</p>
          </div>
        </div>
      )}
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-border/60 bg-background/85 backdrop-blur-md md:top-0">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4 md:px-8">
          <button
            type="button"
            onClick={() => void done()}
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back
          </button>
          <SaveStatus status={status} />
          <button
            type="button"
            onClick={() => void done()}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground shadow-soft transition hover:-translate-y-0.5"
          >
            <Check className="size-4" aria-hidden />
            Done
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-5 pt-8 md:px-8 md:pt-12">
        {status === "conflict" && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-saffron/40 bg-accent px-4 py-3 text-sm text-accent-foreground">
            This memory was changed on another device. Reload to see the latest version before continuing.
            <button type="button" onClick={() => window.location.reload()} className="rounded-full bg-primary px-3 py-1.5 font-medium text-primary-foreground">
              Reload
            </button>
          </div>
        )}

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-2">
          <DatePill value={memoryDate} onChange={setMemoryDate} />
          <CollectionPicker value={collectionId} onChange={setCollectionId} collections={collections} />

          <TagInput value={tags} onChange={setTags} suggestions={tagSuggestions} />

        </div>

        {/* Title */}
        <textarea
          value={title}
          onChange={(e) => setTitle(e.target.value.replace(/\n/g, ""))}
          placeholder="Untitled, and that's fine"
          rows={1}
          maxLength={300}
          aria-label="Title"
          className="mt-8 w-full resize-none bg-transparent font-serif text-[2.2rem] leading-tight tracking-[-0.02em] outline-none [field-sizing:content] placeholder:text-muted-foreground/50 md:text-[2.8rem]"
        />

        {/* Optional prompts, only while the page is empty */}
        {isEmpty && (
          <div className="animate-rise mt-4 flex flex-wrap gap-2">
            {PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => insertPrompt(p)}
                className="rounded-full border border-dashed border-border px-3 py-1.5 text-sm text-muted-foreground transition hover:-translate-y-0.5 hover:border-saffron/60 hover:text-foreground"
              >
                {p}
              </button>
            ))}
          </div>
        )}

        {/* Photos, videos and files: shown right here so you always see what you added */}
        <section aria-label="Photos, videos and files" className="mt-6 space-y-3">
          <AttachmentGallery items={attachments} uploads={uploads} onRemove={removeAttachment} />
          <AddMediaZone onFiles={(files) => pickFiles(files)} maxBytes={uploadMaxBytes} compact={attachments.length + uploads.length > 0} />
        </section>

        <div className="mt-8">
          {editor && <Toolbar editor={editor} />}
          <EditorContent editor={editor} />
        </div>
        <div className="h-24" />

      </div>

      <div className="pointer-events-none fixed right-4 bottom-24 rounded-full border border-border bg-card/90 px-3 py-1 text-xs text-muted-foreground shadow-soft backdrop-blur md:right-8 md:bottom-6">
        {words.toLocaleString("en-US")} {words === 1 ? "word" : "words"}
      </div>
    </div>
  );
}

function SaveStatus({ status }: { status: Status }) {
  const map: Record<Status, { icon: React.ReactNode; text: string; tone?: string }> = {
    idle: { icon: <Lock className="size-3.5" />, text: "Private to you" },
    dirty: { icon: <Loader2 className="size-3.5 animate-spin" />, text: "Saving…" },
    saving: { icon: <Loader2 className="size-3.5 animate-spin" />, text: "Saving…" },
    saved: { icon: <Lock className="size-3.5" />, text: "Saved · encrypted" },
    offline: { icon: <CloudOff className="size-3.5" />, text: "Not saved yet, retrying", tone: "text-destructive" },
    conflict: { icon: <CloudOff className="size-3.5" />, text: "Changed elsewhere", tone: "text-destructive" },
  };
  const s = map[status];
  return (
    <span role="status" aria-live="polite" className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", s.tone)}>
      {s.icon}
      {s.text}
    </span>
  );
}

function Toolbar({ editor }: { editor: Editor }) {
  const btn = (active: boolean) =>
    cn(
      "inline-flex size-8 items-center justify-center rounded-lg transition hover:bg-muted",
      active ? "bg-muted text-saffron-strong" : "text-foreground/80",
    );
  function setLink() {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link address", prev ?? "https://");
    if (url === null) return;
    if (url.trim() === "" || url === "https://") editor.chain().focus().extendMarkRange("link").unsetLink().run();
    else editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  }
  return (
    <BubbleMenu
      editor={editor}
      className="flex items-center gap-0.5 rounded-xl border border-border bg-popover p-1 shadow-lift"
    >
      <button type="button" aria-label="Bold" className={btn(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="size-4" />
      </button>
      <button type="button" aria-label="Italic" className={btn(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="size-4" />
      </button>
      <button type="button" aria-label="Strikethrough" className={btn(editor.isActive("strike"))} onClick={() => editor.chain().focus().toggleStrike().run()}>
        <Strikethrough className="size-4" />
      </button>
      <span className="mx-1 h-5 w-px bg-border" />
      <button type="button" aria-label="Heading" className={btn(editor.isActive("heading"))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
        <Heading2 className="size-4" />
      </button>
      <button type="button" aria-label="Quote" className={btn(editor.isActive("blockquote"))} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
        <Quote className="size-4" />
      </button>
      <button type="button" aria-label="Bulleted list" className={btn(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()}>
        <List className="size-4" />
      </button>
      <button type="button" aria-label="Numbered list" className={btn(editor.isActive("orderedList"))} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
        <ListOrdered className="size-4" />
      </button>
      <span className="mx-1 h-5 w-px bg-border" />
      <button type="button" aria-label="Link" className={btn(editor.isActive("link"))} onClick={setLink}>
        <Link2 className="size-4" />
      </button>
    </BubbleMenu>
  );
}

