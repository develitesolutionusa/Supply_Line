import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteShell } from "@/components/layout/SiteShell";
import { clerkAppearance } from "@/lib/clerk/appearance";
import { SITE_NAME } from "@/lib/nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} Wholesale`,
    template: `%s · ${SITE_NAME}`,
  },
  description: "Case-priced wholesale supplies for business accounts.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const shell = <SiteShell>{children}</SiteShell>;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        {publishableKey ? (
          <ClerkProvider appearance={clerkAppearance} publishableKey={publishableKey}>
            {shell}
          </ClerkProvider>
        ) : (
          shell
        )}
      </body>
    </html>
  );
}
