"use client";

import { RouteError } from "@/components/ui/RouteError";

export default function AccountError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError title="Account page error" reset={reset} />;
}
