"use client";

import { CloudOff } from "lucide-react";
import { EmptyState, Page } from "@/components/page";
import { Button } from "@/components/ui/button";

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Page>
      <EmptyState
        icon={CloudOff}
        title="Something went wrong on our side"
        action={
          <Button size="lg" className="h-10 rounded-xl px-5" onClick={() => reset()}>
            Try again
          </Button>
        }
      >
        Your memories are safe. Please try again in a moment. If it keeps happening, reload the page.
      </EmptyState>
    </Page>
  );
}
