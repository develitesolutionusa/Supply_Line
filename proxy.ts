import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isProtectedPath } from "@/lib/auth/paths";

const isWebhookPath = createRouteMatcher(["/api/webhooks(.*)"]);
const clerkEnabled = Boolean(process.env.CLERK_SECRET_KEY);

export default clerkEnabled
  ? clerkMiddleware(async (auth, request) => {
      if (isWebhookPath(request)) {
        return NextResponse.next();
      }
      if (isProtectedPath(request.nextUrl.pathname)) {
        await auth.protect();
      }
    })
  : function proxy() {
      return NextResponse.next();
    };

export const config = {
  matcher: [
    "/((?!_next|api/webhooks|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api(?!/webhooks)|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
