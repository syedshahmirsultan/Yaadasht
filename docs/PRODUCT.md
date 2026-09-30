# Yaadasht: Product

> **Preserve today for your future self.**

Yaadasht (یادداشت, Urdu/Persian for *memory, remembrance, a written recollection*) is a calm, private place to keep the things you want to remember: your journal, what you learned, your ideas, and the moments that mattered. It is designed to be used for decades.

This document defines what we are building and why. Architecture lives in [ARCHITECTURE.md](ARCHITECTURE.md), privacy and security in [SECURITY.md](SECURITY.md).

---

## 1. Principles

1. **A personal space, not software.** Opening Yaadasht should feel like opening a diary, not logging into a dashboard.
2. **Writing comes first.** A new user writes their first memory within seconds of signing up. Everything else is secondary.
3. **Private by default.** Nothing is public unless the user explicitly shares one entry. Content is never sold, never used for ads, never used to train AI.
4. **Honest about privacy.** We describe exactly who can access what (see SECURITY.md). We never claim "end-to-end encrypted" or "zero knowledge", because Yaadasht is neither.
5. **Useful without AI.** AI is optional, off by default, and never required for any core feature.
6. **You own your archive.** Export everything, at any time, in open formats that are readable without Yaadasht.
7. **Built for decades.** Data formats, dates, and exports must still make sense in 2056.
8. **Calm over clever.** Fewer features, done beautifully. No feature exists just because it sounds impressive.

## 2. Who it is for

- People who kept (or want to keep) a diary but find paper and notes apps scattered.
- Learners and builders who want a record of what they learned and made.
- Anyone who wants to look back in 5, 10, 30 years and see who they were.

Non-technical users are the design target. If a screen needs instructions, the screen is wrong.

## 3. Vocabulary (user-facing)

| We say | We never say |
|---|---|
| memory / entry | note, document, record, item |
| collection | folder, workspace, database, notebook |
| write | create, add new, compose |
| look back / on this day | query, filter, browse data |
| letter to your future self | scheduled message, job |
| download your archive | export data dump |

Internally, everything is a generic `Entry` that belongs to a `Collection`.

## 4. Information architecture

```
Today (home)          ← default screen
Timeline              ← your life, year by year (list ⇄ calendar)
Collections           ← Journal · Learnings · Ideas · your own
Search                ← ⌘K anywhere / tab on mobile
────────────────
Letters to the future ← time capsules (inside the account menu + Today card)
Settings              ← account, privacy, AI, export, storage
```

- **Desktop:** slim left rail with 4 destinations + a prominent **Write** button at the top. Settings in the account menu at the bottom.
- **Mobile:** bottom bar, Today · Timeline · **＋ Write** (centered, larger) · Collections · Search.
- Maximum depth: 2 levels. Every screen has one obvious primary action.

## 5. Core screens

### 5.1 Today (home)
What the user wants here: *write, or be gently reminded of the past.*

- Greeting with the date: "Tuesday, 30 September".
- An inline **"What do you want to remember about today?"** field, clicking it opens the full editor in the Journal with today's date. No modal, no choices first.
- **On this day** card (if anything exists): "3 years ago today" with excerpt + first photo. Tapping opens the memory.
- **Recently**, the last few memories, as quiet cards.
- **Continue writing**, if a draft from today exists.

### 5.2 The editor (the heart of the product)
- Full-height writing surface. Serif body type, ~65–72 characters per line, generous line height.
- Title is optional; placeholder "Untitled, that's fine".
- Formatting toolbar appears only on text selection (bubble menu) and via `/` for blocks (heading, list, quote, checklist, divider, image, video, file).
- Paste or drag images/videos/files directly into the text.
- Links auto-detected; pasted URLs become rich link cards (title only, fetched server-side, no third-party preview services).
- **Metadata row** (quiet, above the title): date · collection · tags. Date defaults to today and is changeable with a small calendar.
- **Autosave** every ~1s of inactivity; status is a tiny "Saved" that fades. Never a "Save" button. Every save is encrypted before it touches the database.
- **Focus mode**: hides everything except the text.
- No character limit on text.

### 5.3 Journal experience
- Opening Journal lands directly on today's page if it exists, otherwise a fresh page dated today.
- **Optional prompts** appear as faint chips below the title: *How was your day? · What happened today? · What did you learn? · What are you thinking about? · What are you grateful for? · What should future you remember?* Tapping one inserts it as a soft heading. Ignoring them costs nothing; they disappear once you start typing.
- Page turn: previous/next day arrows at the edges.
- Feels like a diary: warm paper background, date as a handwritten-feeling serif heading.

### 5.4 Timeline
- A vertical scroll through life grouped by **year → month**, with a sticky year marker.
- Photos shown inline as small thumbnails so the timeline feels visual.
- Toggle to **Calendar** view: month grid with dots on days that have memories; tap a day to see them. Year heatmap for a bird's-eye view of a whole year.
- Filters (collection, tag, has photos/videos) as a single quiet filter button, not a sidebar.

### 5.5 On this day
- Its own full page (reached from the Today card): each previous year that has memories on this date, newest first, as "1 year ago", "5 years ago".
- If today has no past memories, show the nearest dates ("A week from now, 2 years ago…") so the page is rarely empty.
- Optional daily email "On this day" digest, **off by default**.

### 5.6 Collections
- Default: **Journal**, **Learnings**, **Ideas**. Users can create, rename, recolor, reorder, and archive their own (Books, Travel, Career…).
- Each collection shows memories as cards, newest first, with a Write button that pre-selects that collection.
- Default collections can be renamed or hidden but not deleted (Journal gets the special diary behavior).

### 5.7 Search
- One search box. Results update as you type (prefix matching), grouped by year.
- Filters: collection, tag, date range, has media.
- Matching words highlighted in excerpts.
- Keyword search works on encrypted content (see ARCHITECTURE §6). Semantic "search by meaning" comes with Phase 7.

### 5.8 Memory detail
- Reading view first (beautiful typography), **Edit** is one click / tap-to-edit.
- Media gallery with lightbox; videos play inline.
- Actions menu: Share · Download (Markdown / PDF / original files) · Move to collection · Delete.

### 5.9 Sharing
- Share one memory at a time. Never a collection, never the archive.
- Share sheet: **Create link** → options: allow downloads (off by default), expires (never / 1 day / 7 days / 30 days / custom), revoke.
- Shared memories show a small "Shared" badge; Settings → Sharing lists every active link with one-click revoke.
- Shared page is minimal, beautiful, `noindex`, and says "Shared from Yaadasht".

### 5.10 Letters to your future self
- "Write a letter to your future self" → editor → **Deliver on** (date picker with presets: 1 year, 5 years, 10 years, custom) → **Send to** (defaults to account email, can be another address) → Schedule.
- Sealed letters are visible in a "Letters on their way" list with countdown ("Opens in 4 years, 3 months"). Content can be hidden from the list ("Keep it a surprise").
- Delivered letters also land in the Journal on their delivery date so they are part of the archive.

### 5.11 Settings (kept small)
- **Make it yours**: theme (Paper, Night ink, match device), accent colour (saffron, rose, sage, ocean, plum), navigation (sidebar or top bar), writing font (classic serif or clean sans), text size. Saved to the account so it follows the person to every device.
- **Account** (Clerk profile, email, sign-in methods, 2FA)
- **Privacy**, plain-language "Who can see my memories" page, active share links, sessions
- **AI**, off by default (Phase 7)
- **Download your archive**
- **Storage**, used / available
- **Delete account**

## 6. Onboarding (target: first word written in < 30 seconds)

1. Landing page → **Start writing** → Clerk sign-up (email, Google, Apple).
2. One screen: "What should we call you?" (prefilled from Clerk), skippable.
3. Straight into today's Journal page with the prompt *"What do you want your future self to remember about today?"*
4. After the first save: a gentle one-time toast, "Your first memory is kept. Come back tomorrow."

No tours, no feature carousel, no empty dashboard.

## 7. Empty states (never blank)

| Screen | Empty state |
|---|---|
| Today, no memories yet | The write field + "Everything you write here stays private to you." |
| On this day, first year | "In a year, this page will show you what you wrote today." |
| Timeline | "Your timeline begins with your first memory." + Write |
| Collection | "Nothing in *Books* yet. What's the last thing you read?" + Write |
| Search, no results | "Nothing found for '…'. Try fewer words, or a different spelling." |
| Letters | "Write something today that you'll open years from now." |

## 8. Media limits (V1)

| Type | Limit |
|---|---|
| Images | 250 MB per file (JPEG, PNG, WebP, GIF, HEIC/HEIF) |
| Videos | 250 MB **and** ≤ 10 minutes per file (MP4, MOV, WebM) |
| Files | 250 MB per file (PDF, documents, audio, any type) |
| Per entry | 50 attachments |
| Storage per user | configurable; default decided before launch (see open decisions) |

- Uploads go directly to storage with a progress bar, resumable on flaky connections.
- iPhone HEIC photos are converted to a web-viewable copy for display; the original is kept for download and export.
- Errors are human: "This video is 14 minutes long, Yaadasht keeps videos up to 10 minutes. You could trim it and try again."

## 9. Export & data ownership

- **Download everything** from Settings. We prepare a ZIP in the background and email a link (signed-in only, expires in 24h).
- Per-memory download: Markdown, PDF, or original attachments.
- Archive format (readable without Yaadasht):

```
yaadasht-archive-2026-09-30/
├── README.txt                 ← explains the format in plain language
├── index.html                 ← open in any browser to read your whole archive offline
├── entries.json               ← complete structured data (versioned schema)
├── collections/
│   ├── Journal/
│   │   └── 2026-09-30-a-quiet-tuesday.md   ← YAML frontmatter + Markdown body
│   ├── Learnings/
│   └── Ideas/
├── media/
│   └── 2026-09-30-a-quiet-tuesday/
│       ├── photo-1.heic       ← original files, original names
│       └── clip.mp4
└── letters/                   ← letters to your future self
```

## 10. Brand

**Feeling:** personal, reflective, calm, timeless, private, elegant.

**Logo:** a glowing profile of a person whose mind is lit up by orbiting memories (photos, moments), in deep night blue and amber. Artwork in `public/brand/`; favicon and app icon generated from it (`src/app/icon.png`, `apple-icon.png`). The Urdu wordmark یادداشت (Noto Nastaliq Urdu outlines, SIL OFL 1.1) appears in the footer.

**Palette (initial):**

| Token | Light | Dark ("night ink") |
|---|---|---|
| paper (background) | `#FAF7F2` warm ivory | `#14161C` |
| ink (text) | `#23252F` | `#E9E4DA` |
| muted | `#7A7568` | `#8C8779` |
| accent (saffron) | `#C8893A` | `#D9A05B` |
| line | `#E7E1D6` | `#2A2D36` |

**Type:** a literary serif for writing and reading (Newsreader or Literata), a quiet humanist sans for UI (Inter). The Urdu wordmark یادداشت appears on the landing and sign-in pages.

**Motion:** 150–250ms ease-out fades and gentle rises. Page transitions soft; On-this-day cards reveal gently. Respects `prefers-reduced-motion`. No bouncing, no confetti.

**Voice:** warm, short, human. "Your memory is kept." not "Entry saved successfully."

## 11. Quality bar

- Accessible: WCAG 2.2 AA contrast, full keyboard use, visible focus, screen-reader labels, 44px touch targets.
- Responsive from 360px phones to large desktops; the editor is excellent on mobile.
- Fast: Today screen interactive in < 1.5s on a mid-range phone; typing never lags.
- Errors say what happened and what to do, never stack traces or codes.
- Destructive actions (delete memory, revoke share, delete account) are clearly labeled; memory deletion goes to **Trash (30 days)** with undo.

## 12. Scope

**V1 (Phases 1–6, 8):** writing, collections, tags, dates, media, search, timeline, calendar, on this day, sharing, letters to the future, export.
**Later:** optional AI (Phase 7), semantic search, entry version history, PWA/offline writing, mobile apps, import from Day One / Notion / Apple Notes, optional client-side-encrypted "private mode" for the most sensitive collections.
