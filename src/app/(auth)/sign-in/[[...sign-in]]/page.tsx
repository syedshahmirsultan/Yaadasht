import { SignIn } from "@clerk/nextjs";
import type { Metadata } from "next";
import { AuthCardSkeleton } from "@/components/auth-card-skeleton";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <>
      <AuthCardSkeleton title="Welcome back" />
      <SignIn />
    </>
  );
}
