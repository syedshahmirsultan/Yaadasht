import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-dvh flex-col">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[36rem] bg-[radial-gradient(50rem_24rem_at_50%_-10%,color-mix(in_oklab,var(--saffron)_16%,transparent),transparent_70%)]"
      />
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 md:px-8">
        <Link href="/" aria-label="Yaadasht home">
          <Logo />
        </Link>
        <ThemeToggle />
      </header>
      <main className="flex flex-1 flex-col items-center px-4 pt-4 pb-10">
        <div className="animate-rise flex w-full flex-col items-center">
          {/* Reserve space so the page doesn't sit empty while the sign-in form loads */}
          <div className="flex min-h-[30rem] w-full justify-center">{children}</div>
        </div>
      </main>
      <footer className="flex flex-col items-center gap-1 pb-8 text-sm text-muted-foreground">
        <span>Preserve today for your future self.</span>
      </footer>
    </div>
  );
}
