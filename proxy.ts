import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isProtectedApiPath, isProtectedPath } from "@/lib/auth/paths";

const isWebhookPath = createRouteMatcher(["/api/webhooks(.*)"]);
const clerkEnabled = Boolean(process.env.CLERK_SECRET_KEY);

export default clerkEnabled
  ? clerkMiddleware(async (auth, request) => {
      if (isWebhookPath(request)) {
        return NextResponse.next();
      }

      const pathname = request.nextUrl.pathname;
      if (!isProtectedPath(pathname)) {
        return NextResponse.next();
      }

      const { userId } = await auth();
      if (userId) {
        return NextResponse.next();
      }

      if (isProtectedApiPath(pathname)) {
        return NextResponse.json({ error: "Sign in required" }, { status: 401 });
      }

      await auth.protect();
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
