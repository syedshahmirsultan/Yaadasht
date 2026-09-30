import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function Page({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("mx-auto w-full max-w-2xl px-5 py-8 md:px-8 md:py-14", className)}>{children}</div>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="animate-rise flex items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="text-sm text-muted-foreground">{eyebrow}</p>}
        <h1 className="font-serif text-[2.2rem] leading-tight tracking-[-0.02em] md:text-[2.8rem]">{title}</h1>
        {description && <p className="mt-2 max-w-prose text-muted-foreground">{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center overflow-hidden rounded-[1.5rem] border border-border bg-card px-6 py-14 text-center shadow-soft",
        className,
      )}
    >
      <span className="mb-5 inline-flex size-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-soft">
        <Icon className="size-6" aria-hidden />
      </span>
      <p className="font-serif text-2xl">{title}</p>
      {children && <div className="mt-2 max-w-sm text-[0.95rem] text-muted-foreground">{children}</div>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-3 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">{children}</h2>
  );
}
