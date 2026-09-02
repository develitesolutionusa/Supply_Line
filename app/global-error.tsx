"use client";

import { RouteError } from "@/components/ui/RouteError";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-full bg-[#F8FAFC] font-sans text-[#0F172A]">
        <RouteError title="Application error" reset={reset} />
      </body>
    </html>
  );
}
