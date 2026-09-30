# Yaadasht: Database Schema

PostgreSQL 16+, managed with **Drizzle ORM** and SQL migrations checked into the repo.

Conventions:
- Primary keys: `uuid` (v7, time-ordered) generated in the app (`src/lib/id.ts`).
- `*_enc` columns are `bytea` ciphertext produced by the app's encryption module (see [SECURITY.md §5](SECURITY.md)). They are never queried, only decrypted after loading.
- All user-owned tables carry `user_id` directly (not only via joins) so every query can be scoped by the authenticated user, and so row-level checks are trivial to audit.
- Timestamps are `timestamptz`. The user's **memory date** is a plain `date` (a calendar day, independent of timezone, "30 Sept 2026" must stay 30 Sept forever).
- Soft delete via `deleted_at` for Trash; a purge job hard-deletes after 30 days.
- Large binaries never go in Postgres, only object keys pointing to S3-compatible storage.

---

## Entity overview

```
users ──1:1── user_keys
  │
  ├──< collections ──< entries >──< entry_tags >── tags
  │                     │
  │                     ├──< attachments
  │                     ├──< entry_search_tokens
  │                     └──< shares
  ├──< scheduled_messages
  ├──< exports
  └──1:1── ai_settings            (Phase 7)
```

Identity (passwords, sessions, email verification, 2FA) lives in **Clerk**. We keep a minimal `users` row keyed by the Clerk user ID, created on first sign-in / via the `user.created` webhook.

## Tables

### `users`
| column | type | notes |
|---|---|---|
| id | uuid PK | internal ID used everywhere |
| clerk_user_id | text unique not null | from Clerk session |
| email | text | mirrored from Clerk for letter defaults; updated via webhook |
| display_name | text | optional |
| timezone | text | IANA zone, for "today" and On This Day |
| storage_used_bytes | bigint default 0 | maintained on upload/delete |
| storage_quota_bytes | bigint | per-plan / per-instance default |
| created_at, updated_at | timestamptz | |
| deleted_at | timestamptz | account deletion in progress |

### `user_keys`
| column | type | notes |
|---|---|---|
| user_id | uuid PK FK users | |
| key_version | smallint | increments on UDK rotation |
| wrapped_key | bytea | UDK wrapped by the master key (AES-256-GCM) |
| master_key_id | text | which master key/provider wrapped it |
| created_at, rotated_at | timestamptz | |

Deleting this row = crypto-shred.

### `collections`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | |
| kind | text | `journal` \| `learnings` \| `ideas` \| `custom`, drives special UX (e.g., diary mode) |
| name_enc | bytea null | custom name; null for defaults unless renamed |
| color | text | palette token, e.g. `saffron` |
| icon | text | icon key |
| position | int | sort order |
| archived_at | timestamptz | hidden but kept |
| created_at, updated_at | timestamptz | |

Index: `(user_id, position)`. Default three rows created at signup.

### `entries`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | |
| collection_id | uuid FK collections | |
| memory_date | date not null | defaults to user's "today"; editable |
| title_enc | bytea null | |
| body_enc | bytea not null | Tiptap/ProseMirror JSON, encrypted |
| body_format | smallint | schema version of the body JSON |
| excerpt_enc | bytea | first ~200 chars plaintext, encrypted, fast card rendering without decrypting full bodies |
| word_count | int | plaintext, for stats |
| has_media | boolean | for filters |
| kind | text default `entry` | `entry` \| `letter` (delivered letter placed in journal) |
| revision | int default 1 | optimistic concurrency for multi-device edits |
| created_at, updated_at | timestamptz | |
| deleted_at | timestamptz | Trash |

Indexes:
- `(user_id, memory_date DESC) WHERE deleted_at IS NULL`, timeline, calendar
- `(user_id, collection_id, memory_date DESC)`, collection view
- `(user_id, (extract(month from memory_date)), (extract(day from memory_date)))`, On This Day

### `tags`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | |
| name_enc | bytea | display name |
| name_hmac | bytea | HMAC of normalized name, uniqueness + lookup without plaintext |
| created_at | timestamptz | |

Unique: `(user_id, name_hmac)`.

### `entry_tags`
| column | type |
|---|---|
| entry_id | uuid FK entries |
| tag_id | uuid FK tags |
| user_id | uuid |

PK `(entry_id, tag_id)`; index `(user_id, tag_id)`.

### `entry_search_tokens`
| column | type | notes |
|---|---|---|
| user_id | uuid | |
| entry_id | uuid FK entries on delete cascade | |
| token | bytea(16) | truncated HMAC of a word or prefix (see SECURITY §6) |

PK `(user_id, token, entry_id)`. Rebuilt for an entry on every save (delete + insert in the same transaction).

### `attachments`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | |
| entry_id | uuid FK entries null | null while uploading before the entry is first saved |
| kind | text | `image` \| `video` \| `file` |
| object_key | text | `u/{user_id}/{id}` |
| display_object_key | text null | web-friendly copy (e.g., HEIC → JPEG) |
| thumb_object_key | text null | thumbnail / video poster |
| filename_enc | bytea | |
| mime_type_enc | bytea | |
| meta_enc | bytea null | width, height, duration, etc. |
| size_bytes | bigint | quota accounting |
| status | text | `uploading` \| `processing` \| `ready` \| `rejected` |
| created_at | timestamptz | |
| deleted_at | timestamptz | |

Index: `(entry_id)`, `(user_id, status)`.

### `shares`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | |
| entry_id | uuid FK entries on delete cascade | |
| token_hash | bytea unique | SHA-256 of the link token (lookup) |
| token_enc | bytea | link token encrypted with UDK, so the owner can copy the link again |
| allow_download | boolean default false | |
| expires_at | timestamptz null | null = never |
| revoked_at | timestamptz null | |
| view_count | int default 0 | |
| last_viewed_at | timestamptz | |
| created_at | timestamptz | |

### `scheduled_messages`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | |
| title_enc | bytea | |
| body_enc | bytea | Tiptap JSON |
| recipient_enc | bytea | email address |
| delivery_mode | text | `full` \| `link` |
| deliver_at | timestamptz | chosen date at 09:00 in user's timezone |
| status | text | `scheduled` \| `sending` \| `sent` \| `failed` \| `cancelled` |
| attempts | int default 0 | |
| last_error_code | text | never contains content |
| sent_at | timestamptz | |
| delivered_entry_id | uuid null | the Journal entry created on delivery |
| created_at, updated_at | timestamptz | |

Index: `(status, deliver_at) WHERE status = 'scheduled'`.

### `exports`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| user_id | uuid FK | |
| status | text | `queued` \| `building` \| `ready` \| `failed` \| `expired` |
| object_key | text | ZIP in a separate `exports/` prefix, lifecycle-deleted after 24h |
| size_bytes | bigint | |
| created_at, ready_at, expires_at | timestamptz | |

### `ai_settings` (Phase 7)
| column | type | notes |
|---|---|---|
| user_id | uuid PK | |
| enabled | boolean default false | |
| consent_version | int | bumps when the AI privacy notice changes; re-consent required |
| consented_at | timestamptz | |
| created_at, updated_at | timestamptz | |

Embeddings for semantic search are designed in [AI.md](AI.md) and added only in Phase 7.

### Scheduled work
No job-queue library. Vercel Cron calls `/api/cron/*` routes that claim due rows (`scheduled_messages`, trash purge) with `FOR UPDATE SKIP LOCKED`, so runs are safe to repeat.

## Supabase notes
- Tables live in the `yaadasht` schema (not `public`), so Supabase's Data API never exposes them; RLS is enabled on every table with no policies.
- The app uses the **transaction pooler** (port 6543, `prepare: false`); migrations use the **session pooler** (port 5432).
- Implementation: `src/server/db/schema.ts`; migrations in `drizzle/`.

## Encrypted payload shapes

Ciphertexts decrypt to UTF-8 JSON or text:

```jsonc
// entries.body_enc
{ "type": "doc", "content": [ /* ProseMirror nodes; images reference { "attachmentId": "..." } */ ] }
// attachments.meta_enc
{ "width": 4032, "height": 3024, "durationSec": 312.4 }
```

Body JSON never embeds binary data or presigned URLs, only attachment IDs, resolved at render time.

## Migrations & longevity

- Every migration is forward-only SQL reviewed in PRs.
- `body_format` and the ciphertext version byte let us evolve the editor schema and algorithms without breaking decades-old entries.
- `entries.json` in exports includes `schemaVersion` so archives remain interpretable.
