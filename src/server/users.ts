import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { isValidTimeZone } from "@/lib/dates";
import { uuidv7 } from "@/lib/id";
import { createUserKeyMaterial } from "@/server/crypto/userKeys";
import { getDb } from "@/server/db";
import { collections, userKeys, users, type User } from "@/server/db/schema";

export const TZ_COOKIE = "yd_tz";

const DEFAULT_QUOTA_BYTES = Number(process.env.DEFAULT_STORAGE_QUOTA_BYTES ?? 500 * 1024 * 1024);

const DEFAULT_COLLECTIONS = [
  { kind: "journal", color: "saffron", icon: "book-open" },
  { kind: "learnings", color: "sage", icon: "lightbulb" },
  { kind: "ideas", color: "dusk", icon: "sparkles" },
] as const;

async function findByClerkId(clerkUserId: string) {
  return getDb().query.users.findFirst({ where: eq(users.clerkUserId, clerkUserId) });
}

async function timezoneFromCookie() {
  const tz = (await cookies()).get(TZ_COOKIE)?.value;
  return isValidTimeZone(tz) ? tz : undefined;
}

/**
 * First visit after sign-up: create the Yaadasht user, their encryption key,
 * and the three default collections, atomically.
 */
async function bootstrapUser(clerkUserId: string): Promise<User> {
  const clerk = await currentUser();
  const id = uuidv7();
  const keyMaterial = await createUserKeyMaterial(id);
  const timezone = (await timezoneFromCookie()) ?? "UTC";

  const created = await getDb().transaction(async (tx) => {
    const [row] = await tx
      .insert(users)
      .values({
        id,
        clerkUserId,
        email: clerk?.primaryEmailAddress?.emailAddress ?? null,
        displayName: clerk?.firstName ?? null,
        timezone,
        storageQuotaBytes: DEFAULT_QUOTA_BYTES,
      })
      .onConflictDoNothing({ target: users.clerkUserId })
      .returning();
    if (!row) return null; // another request created this user first

    await tx.insert(userKeys).values(keyMaterial);
    await tx.insert(collections).values(
      DEFAULT_COLLECTIONS.map((c, position) => ({ id: uuidv7(), userId: id, position, ...c })),
    );
    return row;
  });

  if (created) return created;
  const existing = await findByClerkId(clerkUserId);
  if (!existing) throw new Error("User bootstrap failed");
  return existing;
}

/**
 * The signed-in Yaadasht user. Every data access must go through this so
 * queries are always scoped to the person making the request.
 */
export const requireUser = cache(async (): Promise<User> => {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) redirect("/sign-in");

  const user = (await findByClerkId(clerkUserId)) ?? (await bootstrapUser(clerkUserId));

  // Keep "today" correct when the person travels.
  const tz = await timezoneFromCookie();
  if (tz && tz !== user.timezone) {
    await getDb().update(users).set({ timezone: tz, updatedAt: new Date() }).where(eq(users.id, user.id));
    return { ...user, timezone: tz };
  }
  return user;
});
