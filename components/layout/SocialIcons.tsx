import { COMPANY } from "@/lib/company";

const ICONS = {
  LinkedIn: (
    <path d="M4.98 3.5C4.98 4.88 3.88 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM.22 8.25h4.56V24H.22V8.25zM8.34 8.25h4.37v2.14h.06c.61-1.16 2.1-2.38 4.32-2.38 4.62 0 5.47 3.04 5.47 7v8.99h-4.56v-8c0-1.91-.03-4.36-2.66-4.36-2.66 0-3.07 2.08-3.07 4.22v8.14H8.34V8.25z" />
  ),
  Instagram: (
    <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2zm0 1.5A4.25 4.25 0 0 0 3.5 7.75v8.5A4.25 4.25 0 0 0 7.75 20.5h8.5a4.25 4.25 0 0 0 4.25-4.25v-8.5A4.25 4.25 0 0 0 16.25 3.5h-8.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 1.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM17.5 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z" />
  ),
  Facebook: (
    <path d="M14 8.2h3.2V4.8H14c-3 0-5.1 1.9-5.1 5.1v2.1H6v3.6h2.9V24h4.1v-8.4h3.3l.6-3.6h-3.9v-1.7c0-1.1.5-1.9 1.9-1.9z" />
  ),
  X: (
    <path d="M14.7 10.3 22.6 1h-1.9l-6.8 8.1L8.4 1H1.2l8.3 12.4L1.2 23h1.9l7.3-8.6 5.8 8.6h7.2L14.7 10.3zm-2.6 3 0.8-1.2L4.6 2.3h2.8l5.6 8.2-0.8 1.2 7.9 11.5h-2.8l-6.2-9.1z" />
  ),
} as const;

export function SocialIcons({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex items-center gap-2 ${className}`.trim()} aria-label="Social media">
      {COMPANY.social.map((item) => (
        <li key={item.name}>
          <a
            href={item.href}
            target="_blank"
            rel="noreferrer noopener"
            className="site-footer-social"
            aria-label={item.name}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
              {ICONS[item.name]}
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
