import { clerkMiddleware } from "@clerk/nextjs/server";

// Clerk reads the session here so `auth()` works everywhere. Access control is
// NOT done by path matching: every page, action and route that touches data
// calls `requireUser()` (src/server/users.ts) itself.
export default clerkMiddleware();

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
