"use client";

import { OrganizationSwitcher, SignOutButton, useAuth, useOrganization, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { isBusinessAccountType } from "@/lib/auth/accountType";
import { hasAdminLoginEmail } from "@/lib/auth/admin";

export function AuthNav() {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    return (
      <Link
        href="/sign-in"
        className="inline-flex h-10 items-center rounded-md bg-sky px-3 text-sm font-semibold text-white transition hover:bg-sky-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        Sign in
      </Link>
    );
  }

  return <ClerkAuthNav />;
}

function ClerkAuthNav() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <div className="h-10 w-24 animate-pulse rounded-lg bg-white/10" aria-hidden />;
  }

  if (!isSignedIn) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/sign-up"
          className="hidden rounded-lg px-3 py-2 text-sm font-medium text-slate-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky sm:inline"
        >
          Create account
        </Link>
        <Link
          href="/sign-in"
          className="inline-flex h-10 items-center rounded-md bg-sky px-3 text-sm font-semibold text-white transition hover:bg-sky-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          Sign in
        </Link>
      </div>
    );
  }

  return <SignedInAccountMenu />;
}

function SignedInAccountMenu() {
  const { user } = useUser();
  const { organization } = useOrganization();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const displayName =
    user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress || "Account";
  const isBusiness = isBusinessAccountType(user?.unsafeMetadata?.accountType, {
    hasOrganization: Boolean(organization) || (user?.organizationMemberships?.length ?? 0) > 0,
  });
  const orgName = isBusiness ? organization?.name : undefined;
  const isAdmin = hasAdminLoginEmail([
    user?.primaryEmailAddress?.emailAddress,
    ...(user?.emailAddresses?.map((address) => address.emailAddress) ?? []),
  ]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        className="flex max-w-[14rem] items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky"
        aria-expanded={open}
        aria-controls={menuId}
        aria-haspopup="menu"
        aria-label={`Account menu for ${displayName}`}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky text-xs font-semibold text-white">
          {displayName.slice(0, 1).toUpperCase()}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block truncate text-sm font-medium text-white">{displayName}</span>
          <span className="block truncate text-[11px] text-slate-300">
            {orgName ?? (isBusiness ? "No company yet" : "Individual")}
          </span>
        </span>
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-slate-200 bg-white py-2 text-navy shadow-lg"
        >
          <div className="border-b border-slate-100 px-3 pb-3">
            <p className="truncate text-sm font-semibold">{displayName}</p>
            <p className="truncate text-xs text-slate-500">
              {user?.primaryEmailAddress?.emailAddress}
            </p>
            {isBusiness ? (
              <div className="mt-3">
                <OrganizationSwitcher
                  hidePersonal
                  afterCreateOrganizationUrl="/"
                  afterSelectOrganizationUrl="/"
                  appearance={{
                    elements: {
                      rootBox: "w-full",
                      organizationSwitcherTrigger:
                        "w-full justify-between rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-navy",
                    },
                  }}
                />
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-500">Individual account · retail pricing</p>
            )}
          </div>
          <Link
            href="/account/orders"
            role="menuitem"
            className="block px-3 py-2 text-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-inset"
            onClick={() => setOpen(false)}
          >
            My orders
          </Link>
          <Link
            href="/account"
            role="menuitem"
            className="block px-3 py-2 text-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-inset"
            onClick={() => setOpen(false)}
          >
            Account
          </Link>
          {isAdmin ? (
            <Link
              href="/admin"
              role="menuitem"
              className="block px-3 py-2 text-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-inset"
              onClick={() => setOpen(false)}
            >
              Admin
            </Link>
          ) : null}
          {isBusiness && !organization ? (
            <Link
              href="/create-organization"
              role="menuitem"
              className="block px-3 py-2 text-sm hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-inset"
              onClick={() => setOpen(false)}
            >
              Create company
            </Link>
          ) : null}
          <SignOutButton>
            <button
              type="button"
              role="menuitem"
              className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-inset"
            >
              Sign out
            </button>
          </SignOutButton>
        </div>
      ) : null}
    </div>
  );
}
