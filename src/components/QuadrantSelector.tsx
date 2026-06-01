import type { Quadrant } from "../types";

interface Props {
  selected: Quadrant;
  occupied: Quadrant[];
  disabled: Quadrant[];
  onSelect: (q: Quadrant) => void;
  onToggleDisabled: (q: Quadrant) => void;
}

const ORDER: Quadrant[] = [1, 2, 3, 4];

export default function QuadrantSelector({
  selected,
  occupied,
  disabled,
  onSelect,
  onToggleDisabled,
}: Props) {
  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        {ORDER.map((q) => {
          const isSelected = selected === q;
          const isOccupied = occupied.includes(q);
          const isDisabled = disabled.includes(q);
          return (
            <div
              key={q}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(q)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(q);
                }
              }}
              className={[
                "relative flex aspect-[105/148.5] cursor-pointer flex-col items-center justify-center rounded-md border-2 text-sm font-medium transition",
                isSelected
                  ? "border-blue-600 bg-blue-50"
                  : "border-slate-300 bg-white hover:border-slate-400",
                isDisabled ? "opacity-60" : "",
              ].join(" ")}
              aria-pressed={isSelected}
            >
              {isDisabled && (
                <div
                  className="pointer-events-none absolute inset-0 rounded-[4px]"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(45deg, rgba(239,68,68,0.25) 0 3px, transparent 3px 7px)",
                  }}
                />
              )}
              <span className="text-slate-700">Q{q}</span>
              <span className="mt-0.5 text-[11px] font-normal text-slate-500">
                {isDisabled ? "disabled" : isOccupied ? "image" : "empty"}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleDisabled(q);
                }}
                className="absolute bottom-1 right-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 hover:bg-slate-200"
              >
                {isDisabled ? "enable" : "disable"}
              </button>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Click a cell to target it for placement. Use “disable” to mark a
        peeled-off cell — it’s skipped in the PDF.
      </p>
    </div>
  );
}
