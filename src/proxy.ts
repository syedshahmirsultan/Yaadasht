import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Clerk reads the session here so `auth()` works everywhere. Access control is
// NOT done by path matching: every page, action and route that touches data
// calls `requireUser()` (src/server/users.ts) itself.
//
// The only thing done here is a convenience: signed-in people who open the
// landing page go straight to Today, which lets the landing page stay static.
export default clerkMiddleware(async (auth, req) => {
  if (req.nextUrl.pathname === "/") {
    const { userId } = await auth();
    if (userId) return NextResponse.redirect(new URL("/today", req.url));
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
