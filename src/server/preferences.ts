"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { preferencesPatchSchema, readPreferences, type Preferences } from "@/lib/preferences";
import { getDb } from "@/server/db";
import { users } from "@/server/db/schema";
import { requireUser } from "@/server/users";

export async function updatePreferences(patch: Partial<Preferences>): Promise<{ ok: boolean }> {
  const parsed = preferencesPatchSchema.safeParse(patch);
  if (!parsed.success) return { ok: false };

  const user = await requireUser();
  const next = { ...readPreferences(user.preferences), ...parsed.data };
  await getDb().update(users).set({ preferences: next, updatedAt: new Date() }).where(eq(users.id, user.id));
  revalidatePath("/", "layout");
  return { ok: true };
}
