<div align="center">

<img src="public/brand/yaadasht-mark.webp" alt="Yaadasht" width="96" height="96" />

# Yaadasht

**Preserve today for your future self.**

A private, beautiful home for your journal, the things you learn, your ideas and your memories,
built to be used for decades.

</div>

---

## What it does

*Yaadasht* (یادداشت) is the Urdu and Persian word for a written remembrance. It is a personal memory archive:

- **Write:** a calm editor for journal entries, learnings and ideas, with autosave, tags, dates and collections.
- **Keep:** photos, videos and files live alongside your words. Everything you write is encrypted before it is stored.
- **Look back:** a timeline of your life, instant search, and *On this day*, which brings back what you wrote in earlier years.
- **Make it yours:** light or dark, accent colours, fonts, and a menu on the left, right, top or bottom.
- **Take it with you:** download any memory as Markdown.

## Architecture

```
Browser (Next.js, Tiptap editor)
   │  HTTPS                        │ one-time signed upload / 5-minute signed download
   ▼                               ▼
Vercel: one Next.js app  ───────► Supabase Storage (private bucket: photos, videos, files)
 • pages (React Server Components)
 • server actions (all writes)      ┌──────────────► Clerk (sign-in, sessions, 2FA)
 • encryption module ───────────────┤
                                    └──────────────► Supabase Postgres (schema "yaadasht")
```

| Layer | Technology |
|---|---|
| App | Next.js 16 (App Router), TypeScript, React 19 |
| UI | Tailwind CSS v4, shadcn/ui primitives, Tiptap editor |
| Auth | Clerk |
| Database | Supabase Postgres with Drizzle ORM |
| Files | Supabase Storage (private bucket) |
| Encryption | Node `crypto`: AES-256-GCM, HKDF, HMAC-SHA256 |
| Hosting | Vercel |

### How data flows

1. The editor autosaves about a second after you stop typing, through a server action.
2. The server encrypts titles, text, tags and filenames with the user's own key before writing to Postgres.
3. Each user key is locked by a master key that lives only in the server environment, never in the database.
4. Photos and videos upload straight from the browser to storage; the database keeps an encrypted record of each file.
5. When a user opens the app, the server decrypts their memories and renders them.
6. Search uses keyed word fingerprints (a blind index), so no readable text is stored for it.

The full design is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), and the security model in [docs/SECURITY.md](docs/SECURITY.md).

### Project structure

```
src/
├── app/                 routes: (marketing) landing, (auth) sign-in, (app) the product
├── components/          UI: editor, media, layout (sidebar, dock, command palette), landing
├── lib/                 shared helpers: document model, dates, preferences
└── server/              everything that touches data
    ├── crypto/          encryption, key wrapping, blind search index
    ├── db/              Drizzle schema and client
    ├── entries.ts       reading and writing memories
    ├── attachments.ts   photos, videos and files
    ├── storage.ts       Supabase Storage
    └── actions.ts       server actions called by the UI
docs/                    product, architecture, security, database and AI design
drizzle/                 SQL migrations
tests/                   unit tests plus database and storage integration tests
```

## Contributing

Contributions of every size are welcome: bug fixes, UI polish, accessibility, docs and new features.

### 1. Set up your copy

Requires Node.js 22+ and free accounts on [Clerk](https://clerk.com) and [Supabase](https://supabase.com).

```bash
git clone https://github.com/<your-username>/Yaadasht.git   # after forking
cd Yaadasht
cp .env.example .env.local   # fill in your own Clerk and Supabase values
npm install
npm run keygen               # prints a YAADASHT_MASTER_KEY for .env.local
npm run db:migrate           # creates the tables in your Supabase project
npm run dev                  # http://localhost:3000
```

Use your own development accounts and keys. Never commit `.env.local`.

### 2. Make your change

1. Pick an [open issue](https://github.com/syedshahmirsultan/Yaadasht/issues), or open one to discuss your idea first if it's large.
2. Create a branch from `main`, for example `fix/search-accents` or `feat/calendar-view`.
3. Keep the change focused, and add or update tests where it makes sense.

### 3. Check it

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Integration tests run against your own Supabase project when `.env.local` is filled in; otherwise they are skipped.

### 4. Open a pull request

Describe what changed and why, and add screenshots for anything visual. A maintainer will review it.

### Ground rules

- **Privacy first:** never log or send memory content anywhere (logs, analytics, error trackers).
- **Encryption stays in one place:** only code in `src/server/` reads or writes encrypted columns.
- **Every query is scoped to the signed-in user**, through `requireUser()`.
- **Use plain, friendly language in the UI**, and check light mode, dark mode and phone widths.

More detail is in [CONTRIBUTING.md](CONTRIBUTING.md). Please report security issues privately, as described in [SECURITY.md](SECURITY.md), rather than in a public issue.

## Roadmap

- [x] Sign-in, encryption, app shell, themes and customisable layout
- [x] Editor, collections, tags, trash, search, timeline, *On this day*
- [x] Photos, videos and files
- [ ] Calendar, year view and filters
- [ ] Sharing a single memory by private link
- [ ] Letters to your future self, delivered by email
- [ ] Optional AI memory search (off by default)
- [ ] Full archive export

## License

[AGPL-3.0](LICENSE). The Urdu wordmark is drawn from [Noto Nastaliq Urdu](https://fonts.google.com/noto/specimen/Noto+Nastaliq+Urdu) (SIL Open Font License 1.1).
