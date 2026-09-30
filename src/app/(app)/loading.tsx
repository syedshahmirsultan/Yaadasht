import { Page } from "@/components/page";

export default function Loading() {
  return (
    <Page>
      <div className="animate-pulse space-y-4" role="status" aria-label="Loading">
        <div className="h-4 w-40 rounded bg-muted" />
        <div className="h-9 w-72 rounded bg-muted" />
        <div className="mt-8 h-40 rounded-2xl bg-muted" />
      </div>
    </Page>
  );
}
