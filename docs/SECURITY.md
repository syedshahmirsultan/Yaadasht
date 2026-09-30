# Yaadasht: Security & Privacy Model

This document is the honest description of how Yaadasht protects people's memories, and where the protection stops. If the code and this document disagree, that is a bug.

For vulnerability reporting see [/SECURITY.md](../SECURITY.md).

---

## 1. Summary in plain language

- Everything you **write** (titles, text, tags, collection names, link titles, attachment filenames, letters to your future self) is **encrypted before it is stored in the database**, using a key that is unique to your account.
- The keys that unlock those per-account keys are kept **outside the database** (in a key management service, or a separate secret for self-hosted installs). A stolen database or backup on its own is unreadable.
- Your photos, videos and files are stored in a **private** storage bucket, encrypted at rest by the storage provider, and only reachable through short-lived links issued to you.
- **Yaadasht is not end-to-end encrypted.** The Yaadasht server decrypts your memories to show them to you, search them, share them, and send your letters. Someone who fully controls the running server (or an operator who abuses their access) could read them. We minimize and audit that access, but we do not pretend it is impossible.
- Nothing is public unless you share a single memory. Nothing is sold, used for ads, or used to train AI.

We do **not** use the phrases "end-to-end encrypted", "zero knowledge", or "military-grade encryption" anywhere in the product or marketing.

## 2. Assets

| Asset | Sensitivity |
|---|---|
| Entry text, titles, tags, links | Very high, lifelong personal writing |
| Attachments (photos, videos, files) | Very high |
| Letters to future self (+ recipient address) | Very high |
| Memory dates, timestamps, counts | Medium, reveal writing habits, not content |
| Email address / identity | Medium (held by Clerk and mirrored minimally) |
| Share links | High, bearer tokens to a memory |

## 3. Threat model

| Adversary | Goal | Protected? | How |
|---|---|---|---|
| Internet attacker (no access) | Read another user's memories | **Yes** | Clerk auth, per-request ownership checks on every query, TLS, rate limiting, CSP |
| Another Yaadasht user | Read your memories | **Yes** | All queries scoped by `user_id` from the verified Clerk session; IDs are unguessable UUIDs; tests for cross-user access |
| Attacker with a **database dump / leaked backup** | Read content | **Yes** (content) / **No** (metadata) | Content columns are AES-256-GCM ciphertext; per-user keys are wrapped by a master key that is not in the database. Dates, counts, sizes remain visible. |
| Attacker with **storage bucket read access** | Read media | **Partially** | Bucket is private; provider encryption at rest; object keys are random UUIDs; filenames are not in object keys. Someone holding valid bucket credentials *can* read media (see §7). |
| Attacker who **compromises the running app server** | Read content | **No** | The server has access to keys at runtime. Mitigations: least-privilege credentials, 2FA on Vercel/Supabase/Clerk accounts, dependency hygiene, alerting. |
| **Operator / admin** (us) | Browse users' memories | **Reduced, not eliminated** | No admin UI that shows content; production decryption only via the app; break-glass access is logged and reviewed. |
| Clerk (auth provider) | Read content | **Yes** | Clerk only sees identity (email, name, sign-in methods). No content passes through Clerk. |
| Email provider | Read letters | **No** for delivered letters | A letter delivered by email is readable by the sending and receiving mail providers. "Link-only" delivery mode avoids this (§9). |
| AI provider (only if user enables AI) | Read archive | **Yes** for the archive, **No** for sent excerpts | Only a small set of relevant excerpts is sent per question, after explicit consent. See [AI.md](AI.md). |
| Legal request to the operator | Obtain content | **No** | Because the server can decrypt, the operator can be compelled. We will document our policy and publish a transparency note. |
| Someone with access to the user's unlocked device | Read content | **No** | Out of scope; mitigated by Clerk session expiry and "sign out everywhere". |

## 4. What each party can see

| Data | Database / backups alone | App server at runtime | Storage bucket | Clerk | Email provider |
|---|---|---|---|---|---|
| Entry title / body / tags / links | ciphertext | plaintext |, |, |, |
| Collection names (custom) | ciphertext | plaintext |, |, |, |
| Memory date, created/updated time | **plaintext** | plaintext |, |, |, |
| Which collection an entry is in | **plaintext** (IDs) | plaintext |, |, |, |
| Word count, attachment count/size | **plaintext** | plaintext | sizes |, |, |
| Attachment filename / MIME type | ciphertext | plaintext |, |, |, |
| Attachment bytes |, | on demand | provider-encrypted at rest |, |, |
| Search tokens | keyed hashes (§6) | computed |, |, |, |
| Letter content & recipient | ciphertext | plaintext at send time |, |, | **plaintext** if full-text delivery |
| Deliver-at date, status | **plaintext** | plaintext |, |, |, |
| Share token | SHA-256 hash only |, |, |, |, |
| Email, name | mirrored email (for letters default) | plaintext |, | plaintext |, |

The plaintext metadata above is a deliberate trade-off (fast timeline, calendar, On This Day, quotas). It reveals *when* and *how much* someone writes, never *what*.

## 5. Encryption design

We use only established primitives from Node's built-in `crypto` module (OpenSSL): AES-256-GCM, HMAC-SHA256 and HKDF-SHA256. No custom cryptography. Implementation: `src/server/crypto/`, tests: `tests/crypto.test.ts`.

### 5.1 Key hierarchy (envelope encryption)

```
Master Key (MK), 32 random bytes in YAADASHT_MASTER_KEY
  • Vercel: "Sensitive" environment variable (not readable back from the dashboard)
  • Never stored in Supabase or in database backups; keep an offline copy in a password manager
  • A cloud KMS can replace it later behind the same KeyProvider interface
        │ wraps (AES-256-GCM, AAD binds it to the user ID)
        ▼
User Data Key (UDK), 32 random bytes per user, generated at signup
  stored in user_keys.wrapped_key (ciphertext), with key_version
        │ HKDF-SHA256
        ├──► content key  (info "yaadasht:enc:v1")    → AES-256-GCM on content fields
        └──► search key   (info "yaadasht:search:v1") → HMAC-SHA256 blind index
```

**Honest note on the free hosting setup:** with the master key in a Vercel environment variable rather than a KMS, anyone who can read the project's production environment (Vercel team members, a compromised Vercel account) plus the database could decrypt content. Protect the Vercel account with 2FA and keep the team minimal.

- **Algorithm:** AES-256-GCM (Node `crypto.createCipheriv('aes-256-gcm')`), 12-byte random nonce, 16-byte tag.
- **Nonce safety:** random 96-bit nonces are safe well beyond realistic per-key message counts for a personal archive (NIST limit 2³² encryptions per key); UDK rotation is available if ever needed.
- **Associated data (AAD):** `yaadasht:v1:{table}:{column}:{row_id}:{user_id}`. Prevents copying ciphertext between rows, columns, or users (the server cannot be tricked into showing user A's text in user B's entry).
- **Stored format** (bytea): `version(1) ‖ udk_version(2) ‖ nonce(12) ‖ ciphertext ‖ tag(16)`. The version byte allows algorithm upgrades over decades.
- **Unwrapped key cache:** derived keys cached in-process for ~5 minutes, never logged, never serialized.
- **KeyProvider interface** (`wrap`, `unwrap`); V1 ships `LocalKeyProvider` (master key from env). Only it touches the master key.
- **Database exposure (Supabase):** all tables live in the private `yaadasht` schema, which Supabase's auto-generated Data API does not expose, and RLS is enabled on every table with no policies (deny-all for Supabase's `anon`/`authenticated` roles). The app connects with the database owner role over TLS.

### 5.2 Rotation
- **Master key rotation:** re-wrap every UDK (small table; background job). Content untouched.
- **UDK rotation:** background job re-encrypts that user's rows; `udk_version` in each ciphertext tells which key to use during migration.

### 5.3 Crypto-shredding on account deletion
Deleting an account deletes the user's wrapped UDK immediately. Any copy of their content that survives in backups becomes permanently undecryptable. Rows and media objects are then purged; backups age out within the retention window (30 days).

## 6. Search on encrypted content (blind index)

Postgres full-text search needs plaintext, which we don't store. We use a **blind index**, a well-known technique (e.g., CipherSweet):

- On save, the server tokenizes the plaintext (Unicode-normalized, lowercased, diacritics folded; supports Urdu/Arabic script, Latin, etc.), and for each word stores `HMAC-SHA256(user_search_key, token)` truncated to 16 bytes. Prefixes of length ≥ 3 are also indexed so results appear as you type.
- `user_search_key` is derived from the UDK with HKDF (`info = "yaadasht:search:v1"`), separate from the encryption key.
- Tokens live in `entry_search_tokens(entry_id, token)` with a B-tree index; a query hashes the search terms the same way and intersects.
- **Leakage (documented):** someone with the database *and without keys* learns only that two entries of the same user share an (unknown) word, and roughly how many distinct words an entry has. Tokens cannot be compared across users (per-user keys). Ranking and snippet highlighting happen after decrypting the matched entries.
- **Limits:** no fuzzy/typo matching and no stemming beyond simple normalization in V1.

## 7. Attachments

- Browser uploads **directly** to Supabase Storage using a one-time signed upload URL that the server issues only after checking ownership, quota (reserved atomically), size (UPLOAD_MAX_BYTES, 50 MB on the free plan) and video length (≤ 10 min). After upload the server confirms the stored size; mismatches are rejected and deleted.
- Object keys are random: `u/{user_uuid}/{attachment_uuid}`, no filenames, no dates. The service key that can read the bucket lives only on the server.
- Bucket: private, no public ACLs, block-public-access on, server-side encryption at rest (provider default encryption on R2 / Supabase Storage).
- Downloads/playback use presigned GET URLs valid for **5 minutes**, issued only to the owner (or to a valid share link that allows it).
- Filename, MIME type, dimensions, and duration are app-encrypted in the database.
- A background job verifies each upload after completion (actual size, magic bytes, video duration ≤ 10 min via `ffprobe`) and generates thumbnails/posters. Failed checks delete the object.

**Honest limitation:** attachment bytes are protected by the storage provider's encryption at rest and by access control, **not** by Yaadasht's per-user keys. Application-level encryption of media would require streaming every upload and every video byte-range through our servers; it is deferred and listed as a future improvement.

## 8. Sharing

- A share link is `https://yaadasht.com/s/{token}` where `token` is 32 random bytes (base64url). Lookup uses `SHA-256(token)`; the token itself is stored only encrypted with the owner's UDK (so they can copy the link again). A database leak alone does not reveal usable links.
- The shared page is rendered by the server (decrypting that single entry). It sends `X-Robots-Tag: noindex`, `Referrer-Policy: no-referrer`, and `Cache-Control: private, no-store`.
- **Expiry and revocation are enforced server-side** on every request, including attachment URL issuance.
- **"Allow download"** controls whether download buttons and original-file URLs are offered. It cannot stop a viewer from screenshotting or saving what they can see, the UI says so.
- Shares show the **current** version of the entry; editing the memory updates what viewers see. Deleting the memory kills the link.
- Only one entry per share. There is no way to share a collection or the archive.

## 9. Letters to the future (scheduled messages)

- Letter body and recipient address are encrypted with the user's UDK like any entry.
- A daily Vercel Cron job finds due letters, decrypts at send time, and sends them via Resend.
- **Delivery modes:**
  - **Full letter** (default), the email contains the letter. The email providers (ours and the recipient's) can read it. Stated in the UI.
  - **Link only**, the email says "A letter from your past self is waiting" with a link; reading requires signing in to Yaadasht. Most private; requires the account to still exist.
- Honest limitation: delivery years in the future depends on Yaadasht (or your self-hosted instance) still running and the address still working. We send a yearly "your letter is still on its way" check-in to the sender.

## 10. Logging, analytics, error tracking

- Logger (`pino`) with redaction paths for any field that could hold content (`body`, `title`, `content`, `text`, `tags`, `filename`, `recipient`, `authorization`, `cookie`). Request/response bodies are never logged.
- Server errors are logged with an error code and request ID, not with user input.
- **No third-party analytics** in the app. The marketing site may use a cookieless, self-hosted counter (page views only).
- Error tracking (e.g., Sentry) is **off by default**; if enabled, `sendDefaultPii: false`, request bodies stripped, breadcrumbs from inputs disabled.
- Next.js caching: all routes that return user content are dynamic with `Cache-Control: private, no-store`. No CDN caching of personal pages.

## 11. Web application hardening

- Clerk handles passwords, sessions, email verification, 2FA, bot protection. Clerk middleware protects all `/app` routes; every server action/route re-verifies the session and scopes queries by the authenticated `user_id`.
- Strict Content-Security-Policy (nonce-based scripts; only Clerk's origins allowed), `frame-ancestors 'none'`, HSTS, `X-Content-Type-Options: nosniff`, `Permissions-Policy` minimal.
- Rich text: Tiptap JSON is validated against an allow-listed schema on the server; rendering never uses raw HTML from users. Pasted HTML is sanitized by Tiptap's schema.
- Link cards: server-side fetching with SSRF protection (block private IP ranges, timeouts, size caps).
- Rate limits on write, upload-init, search, share creation, and share views.
- Clerk webhooks verified with their signing secret (Svix).
- Dependencies pinned, Dependabot/Renovate, `npm audit` in CI.

## 12. Backups and data lifecycle

- Postgres: daily encrypted backups + point-in-time recovery, 30-day retention. Backups contain ciphertext only for content; master key is never in the same backup system.
- Storage: versioning with 30-day noncurrent retention to protect against accidental deletion.
- Trash: deleted memories recoverable for 30 days, then purged (rows + media objects).
- Account deletion: immediate crypto-shred of UDK, purge of rows and media within 24 hours, backups expire within 30 days.

## 13. Account recovery

Recovery is handled entirely by Clerk (email verification / password reset / social sign-in). Because keys are server-managed, **forgetting a password never loses memories**. This is a deliberate trade-off chosen over client-side encryption. Account takeover is therefore the main recovery-related risk; we recommend 2FA and surface it in Settings.

## 14. Known limitations (read this)

1. Not end-to-end encrypted: the running server can decrypt content.
2. Metadata (dates, counts, sizes, collection membership) is not encrypted.
3. Media bytes use provider encryption, not per-user application keys.
4. Search tokens leak word co-occurrence within one user's archive to someone holding the database without keys.
5. Letters delivered in full text are readable by email providers.
6. Share links are bearer links: anyone with the link can view until it expires or is revoked.
7. If AI is enabled, selected excerpts are processed by the AI provider under its policies.

## 15. Future privacy improvements (not in V1)

- Optional client-side-encrypted **"Private mode"** collections for the most sensitive writing (with its own passphrase and recovery key; server-side search/AI unavailable there).
- Application-level encryption for media.
- Per-user data residency choice.
- Published transparency report.
