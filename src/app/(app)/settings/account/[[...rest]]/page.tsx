import { UserProfile } from "@clerk/nextjs";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 md:px-8 md:py-12">
      <Link
        href="/settings"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Settings
      </Link>
      <UserProfile path="/settings/account" routing="path" />
    </div>
  );
}
