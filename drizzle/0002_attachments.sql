CREATE TABLE "yaadasht"."attachments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"entry_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"object_key" text NOT NULL,
	"filename_enc" "bytea" NOT NULL,
	"mime_type_enc" "bytea" NOT NULL,
	"meta_enc" "bytea",
	"size_bytes" bigint NOT NULL,
	"status" text DEFAULT 'uploading' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "yaadasht"."attachments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "yaadasht"."attachments" ADD CONSTRAINT "attachments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "yaadasht"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "yaadasht"."attachments" ADD CONSTRAINT "attachments_entry_id_entries_id_fk" FOREIGN KEY ("entry_id") REFERENCES "yaadasht"."entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "attachments_entry_idx" ON "yaadasht"."attachments" USING btree ("entry_id","position");--> statement-breakpoint
CREATE INDEX "attachments_user_status_idx" ON "yaadasht"."attachments" USING btree ("user_id","status");