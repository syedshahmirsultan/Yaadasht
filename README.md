# Yaadasht

**Preserve today for your future self.**

Yaadasht (یادداشت, *memory, remembrance, a written recollection*) is an open-source, private digital memory archive. Keep your journal, what you learned, your ideas, photos and videos in one calm place, and rediscover them years later with a timeline, a calendar, and *On this day*.

> Status: **Phase 1, foundation.** Sign-in, encryption, database and the app shell are in place. The editor arrives in Phase 2.

## Principles

- **Writing first.** Your first memory in seconds.
- **Private by default.** Nothing is public unless you share a single memory. Never sold, never used for ads or AI training.
- **Honest privacy.** Your writing is encrypted before it is stored, with per-account keys held outside the database. Yaadasht is **not** end-to-end encrypted, the server can decrypt to show, search and share your memories. See [docs/SECURITY.md](docs/SECURITY.md) for exactly who can see what.
- **Useful without AI.** Optional AI memory search is off by default.
- **You own your data.** Export everything as Markdown, JSON, original media, and a browsable offline archive.
- **Built for decades.**

## Stack

Next.js 16 · TypeScript · Tailwind CSS v4 · shadcn/ui · Tiptap · Clerk · Supabase Postgres (Drizzle) · S3-compatible storage · Resend · Vercel

Runs entirely on free tiers: Vercel Hobby, Clerk, Supabase, Resend.

## Getting started

Requirements: Node.js 22+.

### 1. Create the free accounts (≈10 minutes)

| Service | What to do | Values you'll copy |
|---|---|---|
| [Clerk](https://dashboard.clerk.com) | Create an application (enable Email + Google) | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` |
| [Supabase](https://supabase.com/dashboard) | Create a project. Click **Connect** | Transaction pooler URL → `DATABASE_URL`; Session pooler URL → `DIRECT_DATABASE_URL` |
| [Vercel](https://vercel.com) | Import this repository (Hobby plan) |, |
| [Resend](https://resend.com) | Needed from Phase 6 | `RESEND_API_KEY` |

In Supabase, you can also turn off the Data API (Project Settings → API), Yaadasht doesn't use it.

### 2. Configure

```bash
cp .env.example .env.local
npm install
npm run keygen          # prints a new YAADASHT_MASTER_KEY
```

Fill in `.env.local`. **Keep a copy of `YAADASHT_MASTER_KEY` in a password manager**, if it is lost, every memory becomes unreadable.

### 3. Create the database tables

```bash
npm run db:migrate
```

### 4. Run

```bash
npm run dev             # http://localhost:3000
npm test                # unit tests (+ DB integration tests when DATABASE_URL is set)
npm run typecheck
npm run lint
```

### Deploying to Vercel

Add the same variables in **Vercel → Project → Settings → Environment Variables** (mark `YAADASHT_MASTER_KEY` and `CLERK_SECRET_KEY` as *Sensitive*), run `npm run db:migrate` against the production database, then deploy.

## Documentation

| Doc | What's inside |
|---|---|
| [docs/PRODUCT.md](docs/PRODUCT.md) | Product principles, UX, screens, brand |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Stack, system design, flows, phases |
| [docs/SECURITY.md](docs/SECURITY.md) | Threat model, encryption, what is and isn't protected |
| [docs/DATABASE.md](docs/DATABASE.md) | Schema |
| [docs/AI.md](docs/AI.md) | Optional AI memory search design |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Security issues: see [SECURITY.md](SECURITY.md), please do not open public issues for vulnerabilities.

## License

[AGPL-3.0](LICENSE)

The Urdu wordmark is drawn from [Noto Nastaliq Urdu](https://fonts.google.com/noto/specimen/Noto+Nastaliq+Urdu) (SIL Open Font License 1.1).
