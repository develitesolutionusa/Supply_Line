export function StepIndicator({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <ol className="flex flex-wrap items-center gap-x-4 gap-y-2" aria-label="Checkout progress">
      {steps.map((label, index) => {
        const active = index === current;
        const done = index < current;
        return (
          <li key={label} className="flex items-center gap-2">
            <span
              className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                active || done ? "bg-sky text-white" : "bg-slate-200 text-slate-600"
              }`}
              aria-current={active ? "step" : undefined}
            >
              {index + 1}
            </span>
            <span className={`text-sm ${active ? "font-semibold text-navy" : "text-slate-500"}`}>
              {label}
            </span>
            {index < steps.length - 1 ? (
              <span className="hidden h-px w-8 bg-slate-200 sm:block" aria-hidden />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
