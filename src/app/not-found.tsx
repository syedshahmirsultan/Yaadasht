import Link from "next/link";
import { LogoTile } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <LogoTile className="size-16 rounded-2xl" title="" />
      <h1 className="mt-6 font-serif text-3xl">This page isn&apos;t here</h1>
      <p className="mt-2 text-muted-foreground">It may have moved, or the link may be incomplete.</p>
      <Link
        href="/"
        className="mt-8 inline-flex h-10 items-center rounded-xl bg-primary px-5 font-medium text-primary-foreground"
      >
        Go home
      </Link>
    </div>
  );
}
