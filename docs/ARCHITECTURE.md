# Yaadasht: Architecture

Companion docs: [PRODUCT.md](PRODUCT.md) · [SECURITY.md](SECURITY.md) · [DATABASE.md](DATABASE.md) · [AI.md](AI.md)

---

## 1. Key decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | **Server-side envelope encryption**, not client-side / end-to-end | Exceptional UX (no passphrase, no lock screen, no lost-data risk), server-side search, easy sharing, reliable letters and exports. Trade-off: the running server can decrypt. Documented honestly in SECURITY.md. |
| D2 | **Clerk** for authentication | Mature, handles passwords, social login, 2FA, sessions, bot protection. We build zero auth code. |
| D3 | **One Next.js app on Vercel (free Hobby plan)**, frontend and backend together | No separate backend or worker. Scheduled work runs on **Vercel Cron**; heavy work (export ZIP, media checks) runs in the browser. |
| D4 | **Supabase Postgres (free) + Drizzle** | Relational, reliable for decades, auditable schema. Tables live in a private `yaadasht` schema, not exposed by Supabase's Data API. |
| D5 | **S3-compatible storage**, direct browser upload via presigned multipart | 250 MB files never pass through Vercel. Provider decided in Phase 3 (see §9). |
| D6 | **Blind-index keyword search** | Search works on encrypted text without storing plaintext. |
| D7 | **Plaintext memory dates** | Fast timeline, calendar, On This Day in SQL. |
| D8 | **Vercel Cron + a jobs table** | Hobby plan runs cron once a day, enough for letters, which are delivered by date. |
| D11 | **Resend** for email | Free tier: 3,000 emails/month, 100/day. |
| D9 | **AI off by default**, server-side retrieval, only excerpts sent | See AI.md. |
| D10 | **AGPL-3.0** license | Keeps hosted forks open. |

## 2. Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router, React Server Components, Server Actions), TypeScript strict |
| UI | Tailwind CSS v4, shadcn/ui (Radix primitives, restyled), Motion for subtle transitions, Lucide icons |
| Editor | Tiptap v2/v3 (StarterKit, Placeholder, Link, Image, custom Video/File nodes, BubbleMenu, slash commands, CharacterCount for word count) |
| Auth | Clerk (`@clerk/nextjs`) |
| DB | Supabase Postgres (transaction pooler, `prepare: false`) + Drizzle ORM + drizzle-kit migrations |
| Storage | S3-compatible via `@aws-sdk/client-s3`, Cloudflare R2 (10 GB free) or Supabase Storage (1 GB free, 50 MB/file limit) |
| Crypto | Node `crypto` (AES-256-GCM, HMAC-SHA256, HKDF); master key in a Vercel *Sensitive* env var behind a `KeyProvider` interface (KMS can be added later) |
| Jobs | Vercel Cron → `/api/cron/*` routes (secured with `CRON_SECRET`), idempotent, `FOR UPDATE SKIP LOCKED` |
| Media | In the browser: duration check, thumbnails/posters (canvas), HEIC → JPEG preview (`heic2any`), optional photo optimization. On the server: size + magic-byte check |
| Email | Resend + React Email templates |
| Export | Built in the browser: streaming ZIP (`client-zip`) written to disk via the File System Access API, with a download fallback |
| Validation | Zod for every input |
| Logging | Small JSON logger with redaction (`src/server/log.ts`) |
| Testing | Vitest (unit, crypto, DB integration), Playwright (E2E, mobile viewports), axe for accessibility |
| Deploy | Vercel (Git integration); migrations run with `npm run db:migrate` against Supabase's session pooler |

## 3. System diagram

```
          Browser (Next.js client, Tiptap, export ZIP builder)
             │  HTTPS                 │ presigned PUT/GET (direct)
             ▼                        ▼
   ┌─────────────────────────┐  ┌──────────────────────┐
   │ Vercel: Next.js app     │  │ S3-compatible bucket │
   │ • RSC pages             │  │ (private)            │
   │ • Server Actions        │  └──────────────────────┘
   │ • Route handlers        │
   │ • Clerk proxy           │
   │ • crypto module ────────┼──► master key (Vercel Sensitive env)
   │ • /api/cron/* ◄─────────┼─── Vercel Cron (daily)
   └───────┬─────────┬───────┘
           │ SQL     └────────► Resend (letters, notices)
           ▼
   ┌─────────────────────────┐
   │ Supabase Postgres       │
   │ schema `yaadasht`       │
   └─────────────────────────┘
   Clerk (identity) ◄── browser sign-in; webhooks ──► Next.js
```

## 4. Code organization

```
yaadasht/
├── docs/
├── src/
│   ├── app/
│   │   ├── (marketing)/          landing, privacy page
│   │   ├── (auth)/               Clerk sign-in / sign-up pages
│   │   ├── (app)/                authenticated app shell
│   │   │   ├── today/
│   │   │   ├── write/[id]/
│   │   │   ├── m/[id]/           memory detail
│   │   │   ├── timeline/
│   │   │   ├── collections/[id]/
│   │   │   ├── search/
│   │   │   ├── on-this-day/
│   │   │   ├── letters/
│   │   │   └── settings/
│   │   ├── s/[token]/            public shared memory
│   │   └── api/                  webhooks, upload init/complete, export download
│   ├── components/               ui/ (shadcn), editor/, memory/, layout/, brand/
│   ├── server/
│   │   ├── auth.ts               requireUser() → { userId } from Clerk session
│   │   ├── crypto/               keyProvider, envelope, fields, blindIndex
│   │   ├── db/                   drizzle schema, client, migrations
│   │   ├── repos/                entries, collections, tags, attachments, shares, letters
│   │   ├── storage/              presign, object ops
│   │   ├── search/               tokenizer, query
│   │   ├── mail/                 Mailer + templates
│   │   └── log.ts                pino + redaction
│   ├── app/api/cron/             Vercel Cron handlers (letters, purge)
│   └── lib/                      shared utils, zod schemas, date helpers
└── tests/
```

**Rule:** only `server/repos/*` read or write encrypted columns, and they do it through `server/crypto/fields.ts`. UI and actions only ever see plaintext domain objects; the DB layer only ever sees ciphertext. This keeps encryption impossible to forget.

## 5. Core flows

### 5.1 Sign-up
1. Clerk sign-up → redirect to `/today`.
2. `requireUser()` finds no `users` row → create user, generate UDK (32 random bytes), wrap via KeyProvider, insert `user_keys`, create default collections, in one transaction. (The Clerk `user.created` webhook does the same idempotently as a backup.)
3. Land on today's Journal page.

### 5.2 Writing & autosave
1. `/write/new?collection=journal` creates nothing until the first keystroke (no empty entries).
2. Editor emits changes; client debounces ~800ms and calls `saveEntry({ id?, revision, title, body, memoryDate, collectionId, tagIds })` (Server Action).
3. Server: validate with Zod (Tiptap schema allow-list) → derive plaintext text → encrypt title/body/excerpt with UDK (AAD bound to row) → recompute search tokens → upsert entry + tokens in one transaction, `revision = revision + 1` guarded by `WHERE revision = :expected`.
4. Revision conflict (another device saved) → client shows "This memory was changed on another device" with *Keep mine* / *See theirs*.
5. Client keeps an unsaved-changes copy in memory only; a `beforeunload` guard warns if a save is pending. On network failure, the draft is held in `sessionStorage` for that tab until the save succeeds, and cleared on sign-out.

Plaintext is never written to the database, logs, or caches at any point, the first autosave is already encrypted.

### 5.3 Reading
Server Components load entries by `user_id`, decrypt in the repo layer, and render. All such routes are `dynamic` with `Cache-Control: private, no-store`. Lists decrypt only `title_enc` + `excerpt_enc`, not full bodies.

### 5.4 Uploading media
1. User drops a file → client checks size ≤ 250 MB and, for video, reads duration via a hidden `<video>` element (≤ 10 min) → friendly error if not.
2. `POST /api/uploads` → server checks auth, quota, declared size/type → creates `attachments` row (`uploading`) → returns presigned multipart URLs (parts of 10 MB).
3. Browser uploads parts in parallel with progress and retry per part.
4. `POST /api/uploads/:id/complete` → server completes multipart, HEADs the object (actual size), reads the first bytes to check the file type (and the MP4/MOV header for duration where present) → status `ready`. Rejections delete the object and show a clear message.
5. Thumbnails, video posters and HEIC → JPEG display copies are generated in the browser before upload (Vercel functions are too short-lived for ffmpeg).
6. Editor shows a local preview immediately (object URL) so the user never waits to keep writing.

### 5.5 On This Day
```sql
SELECT … FROM entries
WHERE user_id = $1 AND deleted_at IS NULL
  AND extract(month FROM memory_date) = $m AND extract(day FROM memory_date) = $d
  AND memory_date < $today
ORDER BY memory_date DESC;
```
Feb 29 memories surface on Feb 28 in non-leap years.

### 5.6 Search
Query → normalize + tokenize → HMAC each term (prefix token for the last term) → `entry_search_tokens` intersection scoped by user → load candidates (≤ 200) → decrypt → rank (term frequency + recency) → highlight → return. Filters (collection, tag, date range, has_media) are plain SQL predicates.

### 5.7 Sharing
Create: random token → store `SHA-256(token)` for lookup → return the URL. View: hash incoming token → check not revoked/expired → load entry → decrypt → render minimal page; attachment URLs issued per request (5-min expiry, downloads only if allowed).

> Decision: with only the hash stored, the owner could copy a link only at creation. **Recommendation:** also store the token encrypted with the UDK (`token_enc`) so owners can copy the link again later. Lookup still uses the hash, so a database leak does not reveal usable links.

### 5.8 Letters to the future
- Scheduling writes a `scheduled_messages` row (encrypted content), nothing in the browser.
- Vercel Cron calls `/api/cron/letters` once a day (Hobby plan; more often on Pro): `UPDATE … SET status='sending' WHERE id IN (SELECT id … WHERE status='scheduled' AND deliver_at <= now() FOR UPDATE SKIP LOCKED LIMIT 50) RETURNING …` → decrypt → send via Resend with idempotency key = message id → `sent`, or back to `scheduled` for retry on the next run (max 7 attempts) → `failed` with a user-visible status. Letters therefore arrive on their chosen **day**, not at an exact time.
- On delivery a copy is added to the user's Journal on that date.

### 5.9 Export
Built in the browser, because Vercel functions have short time limits: the page fetches decrypted memories from `/api/export/entries` in pages of 100 (authenticated, `no-store`), fetches each media file through short-lived signed URLs, and streams everything into a ZIP (`client-zip`) written straight to disk with the File System Access API (download fallback elsewhere). Markdown with YAML frontmatter, `entries.json`, original media and `index.html`, memory use stays flat regardless of archive size, and progress is shown throughout.

## 6. Performance targets

- Autosave round-trip < 300ms p95.
- Timeline pages of 30 entries, cursor-paginated by `(memory_date, id)`.
- Decrypt cost: AES-GCM is ~GB/s; per-page decryption is negligible. Unwrapped keys cached per user for ~5 min.
- Media served directly from storage (optionally behind a CDN with signed URLs; never publicly cacheable).

## 7. Environments & configuration

See `.env.example`. Summary:

```
DATABASE_URL                Supabase transaction pooler (6543)
DIRECT_DATABASE_URL         Supabase session pooler (5432), migrations only
CLERK_SECRET_KEY / NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY / CLERK_WEBHOOK_SECRET
YAADASHT_MASTER_KEY         base64 32 bytes; Vercel "Sensitive"; never with DB backups
CRON_SECRET                 Vercel Cron authorization          (Phase 6)
RESEND_API_KEY / MAIL_FROM                                     (Phase 6)
S3_ENDPOINT / S3_REGION / S3_BUCKET / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY  (Phase 3)
UPLOAD_MAX_BYTES=262144000
VIDEO_MAX_SECONDS=600
DEFAULT_STORAGE_QUOTA_BYTES=524288000
```

## 8. Implementation phases

| Phase | Scope |
|---|---|
| 1 Foundation | Scaffold, Tailwind/shadcn theme & tokens, fonts, logo, Clerk, DB + migrations, crypto module (+ tests), user bootstrap, app shell & navigation (desktop + mobile), Today screen skeleton |
| 2 Core archive | Collections, Tiptap editor, autosave, entries CRUD, tags, memory dates, Journal diary experience & prompts, memory detail, Trash, per-memory Markdown download |
| 3 Attachments | Presigned multipart upload, progress, server-side checks, browser thumbnails, HEIC handling, gallery/lightbox, video player, download, delete, quotas |
| 4 Discovery | Blind-index search, filters, Timeline, Calendar & year heatmap, On This Day page + Today card, collection browsing |
| 5 Sharing | Share links, allow-download, expiry, revoke, shares list, shared page |
| 6 Letters | Letter editor, scheduling, Vercel Cron delivery via Resend, email templates, status list, yearly check-in |
| 7 AI (optional) | See AI.md |
| 8 Export & hardening | Full archive export, PDF export, account deletion + crypto-shred, security & privacy review, CSP audit, backup runbook, docs polish |

Each phase ends with: tests passing, accessibility check, mobile review, and a short demo for approval.

## 9. Open decisions

Decided: Vercel (Hobby, free) · Clerk · Supabase Postgres · Resend · encrypted re-copyable share tokens · 500 MB default quota.

1. **File storage (Phase 3):** Cloudflare R2 (10 GB free, supports 250 MB files, needs a card on file but no charge) vs Supabase Storage (1 GB free, **50 MB per-file limit on the free plan**, would cap videos at 50 MB).
2. **Error tracking** at launch: none (default) vs scrubbed Sentry.
3. **Vercel Hobby is non-commercial.** Moving to Pro is required if yaadasht.com ever charges money or shows ads.
4. **Supabase free projects pause after 7 days without activity**; a daily cron request keeps the database awake.
