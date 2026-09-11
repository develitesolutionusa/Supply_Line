"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { ADMIN_NAV_LINK, NAV_LINKS } from "@/lib/nav";
import { AuthNav } from "@/components/layout/AuthNav";
import { CartButton } from "@/components/layout/CartButton";
import { HeaderSearch } from "@/components/layout/HeaderSearch";
import { Logo } from "@/components/layout/Logo";

export function Header({ showAdmin = false }: { showAdmin?: boolean }) {
  const pathname = usePathname();
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [menuForPath, setMenuForPath] = useState(pathname);
  const links = showAdmin ? [...NAV_LINKS, ADMIN_NAV_LINK] : [...NAV_LINKS];

  if (menuForPath !== pathname) {
    setMenuForPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (pathname.startsWith("/sign-in")) return null;

  return (
    <header className="site-header sticky top-0 z-40 text-navy">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:h-[4.25rem] lg:gap-5 lg:px-8">
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            className="site-header-control inline-flex h-9 w-9 items-center justify-center rounded-md text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
              </svg>
            )}
          </button>
          <Logo />
        </div>

        <nav className="hidden items-center lg:flex" aria-label="Primary">
          {links.map((link) => {
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className="site-header-link inline-flex h-9 items-center px-2.5 text-[13px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky"
              >
                <span className="site-header-text">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex min-w-0 items-center gap-1.5 sm:gap-2">
          <HeaderSearch />
          <AuthNav appearance="toolbar" />
          <CartButton />
        </div>
      </div>

      {open ? (
        <div
          id={panelId}
          className="max-h-[min(70dvh,calc(100dvh-4rem))] overflow-y-auto border-t border-slate-200/80 bg-white lg:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6">
            <nav className="flex flex-col gap-1" aria-label="Mobile">
              {links.map((link) => {
                const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? "page" : undefined}
                    className="site-header-link rounded-md px-3 py-2.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky"
                    onClick={() => setOpen(false)}
                  >
                    <span className="site-header-text">{link.label}</span>
                  </Link>
                );
              })}
            </nav>
            <AuthNav appearance="menu" onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </header>
  );
}
