"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const COOKIE = "yd_tz";

/** Tells the server the person's time zone so "today" is their today. */
export function TimezoneSync({ current }: { current: string }) {
  const router = useRouter();

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz || tz === current) return;
    document.cookie = `${COOKIE}=${encodeURIComponent(tz)}; Path=/; Max-Age=31536000; SameSite=Lax; Secure`;
    router.refresh();
  }, [current, router]);

  return null;
}
