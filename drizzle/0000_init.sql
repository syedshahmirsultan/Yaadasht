CREATE SCHEMA "yaadasht";
--> statement-breakpoint
CREATE TABLE "yaadasht"."collections" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"name_enc" "bytea",
	"color" text DEFAULT 'saffron' NOT NULL,
	"icon" text DEFAULT 'book' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "yaadasht"."collections" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "yaadasht"."entries" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"collection_id" uuid NOT NULL,
	"memory_date" date NOT NULL,
	"title_enc" "bytea",
	"body_enc" "bytea" NOT NULL,
	"body_format" smallint DEFAULT 1 NOT NULL,
	"excerpt_enc" "bytea",
	"word_count" integer DEFAULT 0 NOT NULL,
	"has_media" boolean DEFAULT false NOT NULL,
	"kind" text DEFAULT 'entry' NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "yaadasht"."entries" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "yaadasht"."entry_search_tokens" (
	"user_id" uuid NOT NULL,
	"token" "bytea" NOT NULL,
	"entry_id" uuid NOT NULL,
	CONSTRAINT "entry_search_tokens_user_id_token_entry_id_pk" PRIMARY KEY("user_id","token","entry_id")
);
--> statement-breakpoint
ALTER TABLE "yaadasht"."entry_search_tokens" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "yaadasht"."entry_tags" (
	"entry_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	CONSTRAINT "entry_tags_entry_id_tag_id_pk" PRIMARY KEY("entry_id","tag_id")
);
--> statement-breakpoint
ALTER TABLE "yaadasht"."entry_tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "yaadasht"."tags" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"name_enc" "bytea" NOT NULL,
	"name_hmac" "bytea" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "yaadasht"."tags" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "yaadasht"."user_keys" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"key_version" smallint DEFAULT 1 NOT NULL,
	"wrapped_key" "bytea" NOT NULL,
	"master_key_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"rotated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "yaadasht"."user_keys" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "yaadasht"."users" (
	"id" uuid PRIMARY KEY NOT NULL,
	"clerk_user_id" text NOT NULL,
	"email" text,
	"display_name" text,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"storage_used_bytes" bigint DEFAULT 0 NOT NULL,
	"storage_quota_bytes" bigint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "yaadasht"."users" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "yaadasht"."collections" ADD CONSTRAINT "collections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "yaadasht"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yaadasht"."entries" ADD CONSTRAINT "entries_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "yaadasht"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yaadasht"."entries" ADD CONSTRAINT "entries_collection_id_collections_id_fk" FOREIGN KEY ("collection_id") REFERENCES "yaadasht"."collections"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yaadasht"."entry_search_tokens" ADD CONSTRAINT "entry_search_tokens_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "yaadasht"."entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yaadasht"."entry_tags" ADD CONSTRAINT "entry_tags_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "yaadasht"."entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yaadasht"."entry_tags" ADD CONSTRAINT "entry_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "yaadasht"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yaadasht"."tags" ADD CONSTRAINT "tags_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "yaadasht"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yaadasht"."user_keys" ADD CONSTRAINT "user_keys_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "yaadasht"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "collections_user_position_idx" ON "yaadasht"."collections" USING btree ("user_id","position");--> statement-breakpoint
CREATE INDEX "entries_user_date_idx" ON "yaadasht"."entries" USING btree ("user_id","memory_date" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "entries_user_collection_date_idx" ON "yaadasht"."entries" USING btree ("user_id","collection_id","memory_date" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "entries_on_this_day_idx" ON "yaadasht"."entries" USING btree ("user_id",(extract(month from "memory_date")),(extract(day from "memory_date")));--> statement-breakpoint
CREATE INDEX "entry_search_tokens_entry_idx" ON "yaadasht"."entry_search_tokens" USING btree ("entry_id");--> statement-breakpoint
CREATE INDEX "entry_tags_user_tag_idx" ON "yaadasht"."entry_tags" USING btree ("user_id","tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_user_name_idx" ON "yaadasht"."tags" USING btree ("user_id","name_hmac");--> statement-breakpoint
CREATE UNIQUE INDEX "users_clerk_user_id_idx" ON "yaadasht"."users" USING btree ("clerk_user_id");