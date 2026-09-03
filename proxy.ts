import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isProtectedApiRequest, isProtectedPath } from "@/lib/auth/paths";

const clerkEnabled = Boolean(process.env.CLERK_SECRET_KEY);

export default clerkEnabled
  ? clerkMiddleware(async (auth, request) => {
      const pathname = request.nextUrl.pathname;
      if (isProtectedPath(pathname) || isProtectedApiRequest(pathname, request.method)) {
        await auth.protect();
      }
    })
  : function proxy() {
      return NextResponse.next();
    };

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
