export type WizardStep = "upload" | "edit" | "workspace";

const STEPS: { id: WizardStep; label: string }[] = [
  { id: "upload", label: "Upload" },
  { id: "edit", label: "Crop & rotate" },
  { id: "workspace", label: "Layout" },
];

interface Props {
  current: WizardStep;
}

export default function Stepper({ current }: Props) {
  const currentIndex = STEPS.findIndex((s) => s.id === current);

  return (
    <ol className="flex items-center gap-1.5 sm:gap-3">
      {STEPS.map((step, i) => {
        const state =
          i < currentIndex ? "done" : i === currentIndex ? "current" : "todo";
        return (
          <li key={step.id} className="flex items-center gap-1.5 sm:gap-3">
            <div className="flex items-center gap-2">
              <span
                className={[
                  "grid size-[22px] place-items-center rounded-full font-mono text-[0.6875rem] leading-none transition-colors duration-150 ease-out-quart",
                  state === "current"
                    ? "bg-accent text-on-accent"
                    : state === "done"
                      ? "bg-accent-weak text-accent"
                      : "bg-sunken text-ink-tertiary",
                ].join(" ")}
                aria-hidden="true"
              >
                {state === "done" ? <Check /> : i + 1}
              </span>
              <span
                className={[
                  "hidden text-xs font-medium tracking-[0.01em] sm:inline",
                  state === "current"
                    ? "text-ink"
                    : state === "done"
                      ? "text-ink-secondary"
                      : "text-ink-tertiary",
                ].join(" ")}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span className="h-px w-4 bg-border sm:w-6" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function Check() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 13l4 4L19 7"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
