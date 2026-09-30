import { SignUp } from "@clerk/nextjs";
import type { Metadata } from "next";
import { AuthCardSkeleton } from "@/components/auth-card-skeleton";

export const metadata: Metadata = { title: "Start writing" };

export default function SignUpPage() {
  return (
    <>
      <AuthCardSkeleton title="Create your account" />
      <SignUp />
    </>
  );
}
