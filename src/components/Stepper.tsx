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
    <ol className="flex items-center gap-2 text-xs font-medium">
      {STEPS.map((step, i) => {
        const state =
          i < currentIndex ? "done" : i === currentIndex ? "active" : "todo";
        return (
          <li key={step.id} className="flex items-center gap-2">
            <span
              className={[
                "flex h-5 w-5 items-center justify-center rounded-full text-[11px]",
                state === "active"
                  ? "bg-blue-600 text-white"
                  : state === "done"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-200 text-slate-500",
              ].join(" ")}
            >
              {state === "done" ? "✓" : i + 1}
            </span>
            <span
              className={
                state === "active"
                  ? "text-slate-800"
                  : state === "done"
                    ? "text-slate-600"
                    : "text-slate-400"
              }
            >
              {step.label}
            </span>
            {i < STEPS.length - 1 && (
              <span className="mx-1 h-px w-5 bg-slate-300" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
}
