import Link from "next/link";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/nav";

function LogoMark() {
  return (
    <svg viewBox="0 0 40 40" className="h-9 w-9" aria-hidden>
      <defs>
        <linearGradient id="sl-mark-fill" x1="6" y1="2" x2="36" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="48%" stopColor="#1D4ED8" />
          <stop offset="100%" stopColor="#38BDF8" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#sl-mark-fill)" />
      <rect x="1" y="1" width="38" height="38" rx="10" fill="none" stroke="white" strokeOpacity="0.18" />
      <path
        d="M11 26.5h9.2c2.6 0 2.6-4.2 0-4.2h-3.8c-2.6 0-2.6-4.3 0-4.3H29"
        fill="none"
        stroke="white"
        strokeWidth="2.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="11" cy="26.5" r="1.55" fill="white" />
      <circle cx="29" cy="18" r="1.55" fill="white" />
    </svg>
  );
}

export function Logo({ appearance = "light" }: { appearance?: "light" | "dark" }) {
  const wordmark = appearance === "dark" ? "site-footer-text" : "site-header-text";
  return (
    <Link
      href="/"
      className="site-header-logo flex items-center gap-2.5 rounded-md px-1 py-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky"
      aria-label={`${SITE_NAME} home`}
    >
      <LogoMark />
      <span className="leading-none">
        <span className={`${wordmark} block text-[17px] font-semibold tracking-[-0.03em]`}>
          Supply<span className="font-medium">Line</span>
        </span>
        <span className={`${wordmark} mt-1 hidden text-[9px] font-semibold uppercase tracking-[0.28em] sm:block`}>
          {SITE_TAGLINE}
        </span>
      </span>
    </Link>
  );
}
