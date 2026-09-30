import { ChevronRight, Download, ShieldCheck, UserRound } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Page, PageHeader, SectionTitle } from "@/components/page";
import { AppearancePicker } from "./appearance-picker";
import { readPreferences } from "@/lib/preferences";
import { requireUser } from "@/server/users";

export const metadata: Metadata = { title: "Settings" };

function formatBytes(n: number) {
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  if (n < 1024 * 1024 * 1024) return `${Math.round(n / (1024 * 1024))} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export default async function SettingsPage() {
  const user = await requireUser();
  const usedPct = Math.min(100, (user.storageUsedBytes / user.storageQuotaBytes) * 100);

  return (
    <Page>
      <PageHeader title="Settings" />

      <div className="animate-rise mt-8 space-y-10">
        <section>
          <SectionTitle>You</SectionTitle>
          <Link
            href="/settings/account"
            className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4 transition-colors hover:bg-muted/50"
          >
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-muted">
              <UserRound className="size-5 text-muted-foreground" aria-hidden />
            </span>
            <span className="flex-1">
              <span className="block font-medium">Account &amp; sign-in</span>
              <span className="block text-sm text-muted-foreground">{user.email ?? "Email, password, two-step verification"}</span>
            </span>
            <ChevronRight className="size-5 text-muted-foreground" aria-hidden />
          </Link>
        </section>

        <section>
          <SectionTitle>Make it yours</SectionTitle>
          <AppearancePicker initial={readPreferences(user.preferences)} />
        </section>

        <section>
          <SectionTitle>Privacy</SectionTitle>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 shrink-0 text-saffron-strong" aria-hidden />
              <div className="space-y-2 text-[0.95rem]">
                <p className="font-medium">Who can see your memories</p>
                <ul className="list-disc space-y-1.5 pl-5 text-muted-foreground">
                  <li>Only you. Nothing is public unless you share a single memory.</li>
                  <li>Your writing is encrypted with a key unique to your account before it&apos;s stored.</li>
                  <li>A stolen copy of our database alone would not reveal what you wrote.</li>
                  <li>
                    Yaadasht is not end-to-end encrypted: our server decrypts your memories to show, search and share
                    them for you.
                  </li>
                  <li>Never sold, never used for ads, never used to train AI.</li>
                </ul>
                <Link href="/privacy" className="inline-block pt-1 font-medium underline-offset-4 hover:underline">
                  Read the full privacy details
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section>
          <SectionTitle>Your archive</SectionTitle>
          <div className="space-y-3 rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between text-sm">
              <span>Storage</span>
              <span className="text-muted-foreground">
                {formatBytes(user.storageUsedBytes)} of {formatBytes(user.storageQuotaBytes)}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={Math.round(usedPct)} aria-valuemin={0} aria-valuemax={100} aria-label="Storage used">
              <div className="h-full rounded-full bg-saffron" style={{ width: `${usedPct}%` }} />
            </div>
            <div className="flex items-center gap-3 border-t border-border pt-4 text-muted-foreground">
              <Download className="size-5" aria-hidden />
              <span className="text-[0.95rem]">Download everything you&apos;ve written. Coming soon.</span>
            </div>
          </div>
        </section>
      </div>
    </Page>
  );
}
