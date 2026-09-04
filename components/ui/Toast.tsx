"use client";

import { useEffect, useState } from "react";

export function Toast({
  message,
  onDismiss,
}: {
  message: string | null;
  onDismiss: () => void;
}) {
  const [visible, setVisible] = useState(Boolean(message));

  useEffect(() => {
    setVisible(Boolean(message));
    if (!message) return;
    const handle = window.setTimeout(onDismiss, 6000);
    return () => window.clearTimeout(handle);
  }, [message, onDismiss]);

  if (!message || !visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 flex max-w-sm items-start gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-navy shadow-lg"
    >
      <p className="flex-1">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="rounded-md px-1 text-slate-500 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky"
        aria-label="Dismiss notification"
      >
        ×
      </button>
    </div>
  );
}
