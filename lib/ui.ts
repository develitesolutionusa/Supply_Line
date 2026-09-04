const INPUT =
  "h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm text-navy placeholder:text-slate-400 focus:border-sky focus:outline-none focus:ring-2 focus:ring-sky/30";
const LABEL = "mb-1 block text-sm font-medium text-navy";
const RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky focus-visible:ring-offset-2";
const BUTTON =
  `inline-flex h-11 items-center justify-center rounded-md bg-sky px-5 text-sm font-semibold text-white hover:bg-sky-dark disabled:cursor-not-allowed disabled:bg-slate-300 ${RING}`;
const GHOST =
  `inline-flex h-11 items-center justify-center rounded-md border border-slate-200 bg-white px-5 text-sm font-semibold text-navy hover:bg-slate-50 ${RING}`;
const CARD = "surface-card";

export const fieldClass = { INPUT, LABEL, RING, BUTTON, GHOST, CARD };
