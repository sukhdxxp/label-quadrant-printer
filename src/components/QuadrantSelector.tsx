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
      <div className="grid w-40 grid-cols-2 gap-1.5">
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
                "relative flex aspect-[105/148.5] cursor-pointer flex-col items-center justify-center rounded border-2 transition",
                isSelected
                  ? "border-blue-600 bg-blue-50"
                  : "border-slate-300 bg-white hover:border-slate-400",
                isDisabled ? "opacity-60" : "",
              ].join(" ")}
              aria-pressed={isSelected}
              title={`Quadrant ${q}`}
            >
              {isDisabled && (
                <div
                  className="pointer-events-none absolute inset-0 rounded-[3px]"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(45deg, rgba(239,68,68,0.25) 0 3px, transparent 3px 7px)",
                  }}
                />
              )}
              <span className="text-xs font-semibold text-slate-700">Q{q}</span>
              <span className="text-[10px] font-normal text-slate-500">
                {isDisabled ? "off" : isOccupied ? "image" : "empty"}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleDisabled(q);
                }}
                className="absolute bottom-0.5 right-0.5 rounded bg-slate-100/90 px-1 py-px text-[9px] text-slate-600 hover:bg-slate-200"
              >
                {isDisabled ? "on" : "off"}
              </button>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-slate-500">
        Pick the cell to target. Toggle “off” to mark a peeled cell — it’s
        skipped in the PDF.
      </p>
    </div>
  );
}
