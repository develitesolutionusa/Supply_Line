"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

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
      <body className="min-h-full bg-slate-50 px-6 py-16 text-slate-900">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-600">The error was reported. You can try again.</p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
