import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  customType,
  date,
  index,
  integer,
  jsonb,
  pgSchema,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * All tables live in the `yaadasht` schema, not `public`, so Supabase's
 * auto-generated Data API never exposes them. RLS is also enabled with no
 * policies (deny-all) as a second layer. The app connects as the owner role.
 *
 * Columns ending in `Enc` hold AES-256-GCM ciphertext (see src/server/crypto).
 */
export const app = pgSchema("yaadasht");

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return "bytea";
  },
});

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const users = app
  .table("users", {
    id: uuid("id").primaryKey(),
    clerkUserId: text("clerk_user_id").notNull(),
    email: text("email"),
    displayName: text("display_name"),
    timezone: text("timezone").notNull().default("UTC"),
    storageUsedBytes: bigint("storage_used_bytes", { mode: "number" }).notNull().default(0),
    storageQuotaBytes: bigint("storage_quota_bytes", { mode: "number" }).notNull(),
    /** Appearance choices (accent, layout, fonts), see src/lib/preferences.ts. Not sensitive. */
    preferences: jsonb("preferences").notNull().default({}),
    ...timestamps,
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  }, (t) => [uniqueIndex("users_clerk_user_id_idx").on(t.clerkUserId)])
  .enableRLS();

export const userKeys = app
  .table("user_keys", {
    userId: uuid("user_id")
      .primaryKey()
      .references(() => users.id, { onDelete: "cascade" }),
    keyVersion: smallint("key_version").notNull().default(1),
    wrappedKey: bytea("wrapped_key").notNull(),
    masterKeyId: text("master_key_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    rotatedAt: timestamp("rotated_at", { withTimezone: true }),
  })
  .enableRLS();

export const collectionKinds = ["journal", "learnings", "ideas", "custom"] as const;
export type CollectionKind = (typeof collectionKinds)[number];

export const collections = app
  .table("collections", {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind", { enum: collectionKinds }).notNull(),
    nameEnc: bytea("name_enc"),
    color: text("color").notNull().default("saffron"),
    icon: text("icon").notNull().default("book"),
    position: integer("position").notNull().default(0),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    ...timestamps,
  }, (t) => [index("collections_user_position_idx").on(t.userId, t.position)])
  .enableRLS();

export const entries = app
  .table("entries", {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    collectionId: uuid("collection_id")
      .notNull()
      .references(() => collections.id, { onDelete: "restrict" }),
    memoryDate: date("memory_date", { mode: "string" }).notNull(),
    titleEnc: bytea("title_enc"),
    bodyEnc: bytea("body_enc").notNull(),
    bodyFormat: smallint("body_format").notNull().default(1),
    excerptEnc: bytea("excerpt_enc"),
    wordCount: integer("word_count").notNull().default(0),
    hasMedia: boolean("has_media").notNull().default(false),
    kind: text("kind", { enum: ["entry", "letter"] }).notNull().default("entry"),
    revision: integer("revision").notNull().default(1),
    ...timestamps,
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  }, (t) => [
    index("entries_user_date_idx").on(t.userId, t.memoryDate.desc()),
    index("entries_user_collection_date_idx").on(t.userId, t.collectionId, t.memoryDate.desc()),
    index("entries_on_this_day_idx").on(
      t.userId,
      sql`(extract(month from ${t.memoryDate}))`,
      sql`(extract(day from ${t.memoryDate}))`,
    ),
  ])
  .enableRLS();

export const tags = app
  .table("tags", {
    id: uuid("id").primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    nameEnc: bytea("name_enc").notNull(),
    nameHmac: bytea("name_hmac").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  }, (t) => [uniqueIndex("tags_user_name_idx").on(t.userId, t.nameHmac)])
  .enableRLS();

export const entryTags = app
  .table("entry_tags", {
    entryId: uuid("entry_id")
      .notNull()
      .references(() => entries.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
    userId: uuid("user_id").notNull(),
  }, (t) => [
    primaryKey({ columns: [t.entryId, t.tagId] }),
    index("entry_tags_user_tag_idx").on(t.userId, t.tagId),
  ])
  .enableRLS();

export const entrySearchTokens = app
  .table("entry_search_tokens", {
    userId: uuid("user_id").notNull(),
    token: bytea("token").notNull(),
    entryId: uuid("entry_id")
      .notNull()
      .references(() => entries.id, { onDelete: "cascade" }),
  }, (t) => [
    primaryKey({ columns: [t.userId, t.token, t.entryId] }),
    index("entry_search_tokens_entry_idx").on(t.entryId),
  ])
  .enableRLS();

export type User = typeof users.$inferSelect;
export type Collection = typeof collections.$inferSelect;
export type Entry = typeof entries.$inferSelect;
