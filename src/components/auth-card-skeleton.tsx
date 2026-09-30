import { ClerkLoading } from "@clerk/nextjs";

/** Shown in place of Clerk's form while it loads, so the page never looks empty. */
export function AuthCardSkeleton({ title }: { title: string }) {
  return (
    <ClerkLoading>
      <div className="w-full max-w-[25rem] rounded-2xl border border-border bg-card p-8 shadow-soft" role="status" aria-label="Loading">
        <p className="text-center font-medium">{title}</p>
        <div className="mx-auto mt-2 h-3 w-48 animate-pulse rounded bg-muted" />
        <div className="mt-8 h-10 animate-pulse rounded-lg bg-muted" />
        <div className="mt-6 h-3 w-24 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-10 animate-pulse rounded-lg bg-muted" />
        <div className="mt-6 h-10 animate-pulse rounded-lg bg-primary/20" />
      </div>
    </ClerkLoading>
  );
}
