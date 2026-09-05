import Link from "next/link";

export const metadata = {
  title: "Create account",
};

export default function SignUpSelectorPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-text">Sign up</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-navy sm:text-4xl">
        Choose an account type
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
        Individual accounts use retail pricing. Business accounts create a company organization
        for wholesale case pricing and shared ordering.
      </p>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <Link
          href="/sign-up/individual"
          className="surface-card card-interactive p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-text">Retail</p>
          <h2 className="mt-2 text-xl font-semibold text-navy">Individual</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Order for a personal or small-shop account. No company organization required.
          </p>
          <span className="mt-6 inline-flex h-10 items-center rounded-lg bg-navy px-4 text-sm font-semibold text-white">
            Continue as individual
          </span>
        </Link>
        <Link
          href="/sign-up/business"
          className="surface-card card-interactive p-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-sky-text">Wholesale</p>
          <h2 className="mt-2 text-xl font-semibold text-navy">Business</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Create or join a company organization. After sign-up you will name your business.
          </p>
          <span className="mt-6 inline-flex h-10 items-center rounded-md bg-sky px-4 text-sm font-semibold text-white">
            Continue as business
          </span>
        </Link>
      </div>
      <p className="mt-8 text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/sign-in" className="font-semibold text-navy hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
