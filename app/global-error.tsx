"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { RouteError } from "@/components/ui/RouteError";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-full bg-[#F8FAFC] font-sans text-[#0F172A]">
        <RouteError title="Application error" reset={reset} />
      </body>
    </html>
  );
}
