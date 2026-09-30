import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = { title: "Privacy" };

const SECTIONS: { title: string; items: string[] }[] = [
  {
    title: "What is protected",
    items: [
      "Everything you write (titles, text, tags, collection names, link titles, file names and letters to your future self) is encrypted before it is stored in our database.",
      "Each account has its own encryption key. Those keys are themselves locked with a master key that is kept outside the database, so a stolen copy of the database or a backup does not reveal what you wrote.",
      "Photos, videos and files are kept in private storage, encrypted at rest by the storage provider, and only reachable through short-lived links issued to you.",
      "Nothing is public unless you share a single memory. You can make a shared link expire or revoke it at any time.",
    ],
  },
  {
    title: "What we want you to know",
    items: [
      "Yaadasht is not end-to-end encrypted. Our server decrypts your memories to show them to you, search them, share them when you ask, and deliver your letters. Someone who fully controlled our running server could read them. We keep that access to a minimum and never build tools to browse people's memories.",
      "Some information is not encrypted: the dates of your memories, when they were created or edited, how many you have, and how much storage you use. This lets the timeline and 'On this day' work quickly. It shows when you write, never what you write.",
      "Sign-in is handled by Clerk, which knows your email address and sign-in methods, but never sees your memories.",
      "If you choose to have a letter delivered in full by email, email providers can read that letter.",
    ],
  },
  {
    title: "What we will never do",
    items: [
      "Sell your data or show you ads.",
      "Use your memories to train AI models.",
      "Send your memories to an AI service unless you turn that feature on yourself. It is off by default.",
      "Put your writing in logs or analytics.",
    ],
  },
  {
    title: "Your archive is yours",
    items: [
      "You can download everything you have written and uploaded, in open formats (Markdown, JSON and your original files) that can be read without Yaadasht.",
      "When you delete your account, your encryption key is destroyed immediately, which makes any remaining copies of your writing unreadable. Everything else is removed within 30 days.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex w-full max-w-3xl items-center px-5 py-5 md:px-8">
        <Link href="/" aria-label="Yaadasht home">
          <Logo />
        </Link>
      </header>
      <main className="mx-auto max-w-3xl px-5 pb-24 md:px-8">
        <h1 className="mt-10 font-serif text-[2.4rem] leading-tight">Who can see your memories</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          The honest version, in plain language. The technical details are in our open-source security documentation.
        </p>
        {SECTIONS.map((s) => (
          <section key={s.title} className="mt-12">
            <h2 className="font-serif text-2xl">{s.title}</h2>
            <ul className="mt-4 list-disc space-y-3 pl-5 text-[1.02rem] leading-relaxed">
              {s.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}
