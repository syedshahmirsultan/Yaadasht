import { CalendarDays } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/server/users";
import { EmptyState, Page, PageHeader } from "@/components/page";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Timeline" };

export default async function TimelinePage() {
  await requireUser();
  return (
    <Page>
      <PageHeader title="Timeline" description="Your life, year by year." />
      <EmptyState
        className="animate-rise mt-8"
        icon={CalendarDays}
        title="Your timeline begins with your first memory"
        action={
          <Link href="/write" className={cn(buttonVariants({ size: "lg" }), "h-10 rounded-xl px-5")}>
            Write something
          </Link>
        }
      >
        Every memory you keep will appear here, in the order you lived it.
      </EmptyState>
    </Page>
  );
}
