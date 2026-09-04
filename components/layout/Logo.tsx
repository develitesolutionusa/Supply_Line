import Link from "next/link";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/nav";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2 focus-visible:ring-offset-navy"
      aria-label={`${SITE_NAME} home`}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-sky text-white" aria-hidden>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
          <path
            d="M4 7h16M4 12h16M4 17h10"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </span>
      <span className="leading-tight">
        <span className="block text-base font-semibold tracking-tight text-white">{SITE_NAME}</span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-on-navy">
          {SITE_TAGLINE}
        </span>
      </span>
    </Link>
  );
}
