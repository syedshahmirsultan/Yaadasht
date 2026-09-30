<div align="center">

<img src="public/brand/yaadasht-mark.webp" alt="Yaadasht" width="96" height="96" />

# Yaadasht

**Preserve today for your future self.**

A private, beautiful home for your journal, the things you learn, your ideas and your memories,
built to be used for decades.

</div>

---

## What it is

*Yaadasht* (یادداشت) is the Urdu and Persian word for a written remembrance. The app is a personal memory archive:

- **Write:** a calm editor for journal entries, learnings and ideas, with autosave, tags, dates and collections.
- **Keep:** photos, videos and files live alongside your words. Everything you write is encrypted before it is stored.
- **Look back:** a timeline of your life, instant search, and *On this day*, which brings back what you wrote in earlier years.
- **Make it yours:** light or dark, accent colours, fonts, and a menu that can sit on the left, right, top or bottom.
- **Leave anytime:** memories download as Markdown; full archive export is on the roadmap.

AI is not the product. An optional, off-by-default AI helper is planned for later; Yaadasht is complete without it.

## Architecture at a glance

```
Browser (Next.js, Tiptap editor)
   │  HTTPS                        │ one-time signed upload / 5-minute signed download
   ▼                               ▼
Vercel: one Next.js app  ───────► Supabase Storage (private bucket: photos, videos, files)
 • pages (React Server Components)
 • server actions (all writes)      ┌──────────────► Clerk (sign-in, sessions, 2FA)
 • encryption module ───────────────┤
   (master key from env)            └──────────────► Supabase Postgres (schema "yaadasht")
```

| Layer | Choice |
|---|---|
| App | Next.js 16 (App Router), TypeScript, React 19 |
| UI | Tailwind CSS v4, shadcn/ui primitives, Tiptap editor, CSS-only motion |
| Auth | Clerk |
| Database | Supabase Postgres via Drizzle ORM (migrations in `drizzle/`) |
| Files | Supabase Storage, private bucket, direct browser uploads |
| Crypto | Node `crypto`: AES-256-GCM, HKDF, HMAC-SHA256 |
| Hosting | Vercel, with the region pinned next to the database |

### How a memory is stored

1. You type. The editor autosaves about a second after you pause.
2. The server encrypts the title, text, tags and filenames with **your account's own key** (AES-256-GCM).
3. Your key is itself locked by a **master key that never touches the database**.
4. Postgres receives only ciphertext, plus the few things the app needs to sort and count: dates, sizes and IDs.
5. When you open Yaadasht, the server unlocks your key and shows you your memories as normal.

Search works without storing readable text: each word becomes a keyed fingerprint (a "blind index").

> **Where is my data in Supabase?** Tables live in the **`yaadasht`** schema (Table Editor → schema dropdown), not `public`. Files live in **Storage → `yaadasht-media`**. In both places you will only see ciphertext and random IDs; that is the encryption doing its job.

## Key decisions and why

| Decision | Why |
|---|---|
| **Server-side encryption, not end-to-end** | End-to-end encryption would mean a separate passphrase, a lock screen, and permanent data loss if it's forgotten, plus no server search. We chose an excellent experience and database-level protection, and we say plainly that the running server can decrypt. See [docs/SECURITY.md](docs/SECURITY.md). |
| **One Next.js app, no separate backend** | Fewer moving parts. Server actions handle every write; there is nothing else to deploy. |
| **Tables in a private `yaadasht` schema** | Supabase auto-publishes the `public` schema through its Data API. Keeping our tables elsewhere, with row-level security on, means they can never be exposed that way. |
| **Dates stay readable, content does not** | Timeline, calendar and *On this day* stay fast in SQL. The database knows *when* you wrote, never *what*. |
| **Files upload straight to storage** | Large videos never pass through our servers, which keeps the app fast and cheap. Storage keys contain only random IDs. |
| **Clerk for authentication** | Sign-in, 2FA and account recovery are solved problems; we don't build them. Forgetting a password never loses memories. |
| **Open formats and export** | Memories download as Markdown, readable without Yaadasht, decades from now. |
| **Built on free tiers** | Vercel Hobby, Supabase, Clerk and Resend free plans, so anyone can run their own copy. |

## Project structure

```
src/
├── app/                 routes: (marketing) landing, (auth) sign-in, (app) the product
├── components/          UI: editor, media, layout (sidebar, dock, command palette), landing
├── lib/                 shared helpers: document model, dates, preferences
└── server/              everything that touches data
    ├── crypto/          encryption, key wrapping, blind search index
    ├── db/              Drizzle schema and client
    ├── entries.ts       the only place entry ciphertext is read or written
    ├── attachments.ts   photos, videos and files
    ├── storage.ts       Supabase Storage (swappable for S3 / R2)
    └── actions.ts       server actions; each re-checks the signed-in user
docs/                    product, architecture, security, database and AI design
drizzle/                 SQL migrations
tests/                   unit tests plus database and storage integration tests
```

## Run it locally

Requires Node.js 22+ and free accounts on [Clerk](https://clerk.com) and [Supabase](https://supabase.com).

```bash
cp .env.example .env.local   # fill in the Clerk and Supabase values
npm install
npm run keygen               # prints a YAADASHT_MASTER_KEY; keep a copy somewhere safe
npm run db:migrate           # creates the tables in Supabase
npm run dev                  # http://localhost:3000
```

> **Keep your master key safe.** If `YAADASHT_MASTER_KEY` is lost, every stored memory becomes unreadable.

Useful commands: `npm test` · `npm run typecheck` · `npm run lint` · `npm run build`

## Roadmap

- [x] Foundation: sign-in, encryption, app shell, themes, customisable layout
- [x] Core archive: editor, collections, tags, trash, search, timeline, *On this day*
- [x] Photos, videos and files
- [ ] Discovery: calendar, year view, filters
- [ ] Sharing a single memory by private link
- [ ] Letters to your future self, delivered by email on a chosen date
- [ ] Optional AI memory search (off by default)
- [ ] Full archive export and hardening

## Documentation

| Doc | Read it for |
|---|---|
| [docs/PRODUCT.md](docs/PRODUCT.md) | Principles, screens, brand and UX rules |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design and data flows |
| [docs/SECURITY.md](docs/SECURITY.md) | Threat model: exactly who can see what |
| [docs/DATABASE.md](docs/DATABASE.md) | Schema and conventions |
| [docs/AI.md](docs/AI.md) | The optional AI design |

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) first; it covers the privacy rules every change must follow: never log content, only `src/server` touches encrypted columns, and every query is scoped to the signed-in user. Report security issues privately as described in [SECURITY.md](SECURITY.md).

## License

[AGPL-3.0](LICENSE). The Urdu wordmark is drawn from [Noto Nastaliq Urdu](https://fonts.google.com/noto/specimen/Noto+Nastaliq+Urdu) (SIL Open Font License 1.1).
