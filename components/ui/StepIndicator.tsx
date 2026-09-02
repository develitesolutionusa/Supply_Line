export function StepIndicator({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <ol className="flex flex-wrap gap-2" aria-label="Checkout progress">
      {steps.map((label, index) => {
        const active = index === current;
        const done = index < current;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-semibold ${
                active
                  ? "bg-navy text-white"
                  : done
                    ? "bg-sky text-navy"
                    : "bg-slate-200 text-slate-600"
              }`}
              aria-current={active ? "step" : undefined}
            >
              {index + 1}
            </span>
            <span className={`text-sm ${active ? "font-semibold text-navy" : "text-slate-600"}`}>
              {label}
            </span>
            {index < steps.length - 1 ? <span className="hidden text-slate-300 sm:inline">/</span> : null}
          </li>
        );
      })}
    </ol>
  );
}
