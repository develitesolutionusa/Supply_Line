"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchCart } from "@/lib/cart/client";

export function CartButton() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const cart = await fetchCart();
        if (!cancelled) setCount(cart?.item_count ?? 0);
      } catch {
        if (!cancelled) setCount(0);
      }
    }

    void load();
    const onUpdate = () => void load();
    window.addEventListener("cart-updated", onUpdate);
    window.addEventListener("focus", onUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener("cart-updated", onUpdate);
      window.removeEventListener("focus", onUpdate);
    };
  }, []);

  const label = count === 0 ? "Cart, empty" : `Cart, ${count} cases`;

  return (
    <Link
      href="/cart"
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-200 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky"
      aria-label={label}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path
          d="M6 6h15l-1.5 9h-12L5 3H2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="9" cy="20" r="1.3" fill="currentColor" stroke="none" />
        <circle cx="18" cy="20" r="1.3" fill="currentColor" stroke="none" />
      </svg>
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-4 items-center justify-center rounded-full bg-sky px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
