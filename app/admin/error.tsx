"use client";

import { RouteError } from "@/components/ui/RouteError";

export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError title="Admin page error" reset={reset} />;
}
