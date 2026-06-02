import {
  forwardRef,
  useId,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";

/* ── Button ──────────────────────────────────────────────────────────────
 * One vocabulary across the whole surface. Primary carries the single next
 * action (the One Voice); secondary and ghost are quieter paths.
 */
type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "md" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-md font-semibold " +
  "transition-[background-color,color,border-color,filter] duration-150 ease-out-quart " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent " +
  "disabled:cursor-not-allowed select-none";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-on-accent hover:bg-accent-strong active:brightness-95 " +
    "disabled:bg-sunken disabled:text-ink-tertiary disabled:hover:bg-sunken",
  secondary:
    "bg-surface text-ink border border-border-strong hover:bg-sunken " +
    "disabled:text-ink-tertiary disabled:border-border disabled:hover:bg-surface",
  ghost:
    "text-accent hover:bg-accent-weak " +
    "disabled:text-ink-tertiary disabled:hover:bg-transparent",
};

const SIZES: Record<ButtonSize, string> = {
  md: "px-[18px] py-2.5 text-[0.9375rem]",
  sm: "px-3 py-1.5 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    { variant = "secondary", size = "md", className = "", type, ...rest },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type ?? "button"}
        className={`${BASE} ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
        {...rest}
      />
    );
  },
);

/* ── MeasurementField ──────────────────────────────────────────────────────
 * A numeric stepper. The value rides in monospace with tabular figures so it
 * never reflows while stepping, and the unit suffix sits in quieter ink.
 */
interface MeasurementFieldProps {
  label: ReactNode;
  value: number;
  onChange: (value: number) => void;
  unit: string;
  min: number;
  max: number;
  step?: number;
  hint?: ReactNode;
  /** Character width of the numeric input. */
  valueWidthCh?: number;
  /** Keep the label for screen readers but hide it visually. */
  hideLabel?: boolean;
}

function clamp(v: number, min: number, max: number): number {
  if (Number.isNaN(v)) return min < 0 && max > 0 ? 0 : min;
  return Math.max(min, Math.min(max, v));
}

/** Round to the step grid to avoid float drift like 1.9000000002. */
function snap(v: number, step: number): number {
  return Math.round(v / step) * step;
}

export function MeasurementField({
  label,
  value,
  onChange,
  unit,
  min,
  max,
  step = 1,
  hint,
  valueWidthCh = 3.5,
  hideLabel = false,
}: MeasurementFieldProps) {
  const id = useId();
  const set = (next: number) => onChange(clamp(snap(next, step), min, max));

  const stepBtn =
    "grid w-8 shrink-0 place-items-center text-ink-secondary " +
    "transition-colors duration-150 ease-out-quart hover:bg-sunken hover:text-ink " +
    "active:bg-border disabled:text-ink-tertiary disabled:hover:bg-transparent " +
    "focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent";

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className={
          hideLabel
            ? "sr-only"
            : "text-xs font-medium tracking-[0.01em] text-ink-secondary"
        }
      >
        {label}
      </label>
      <div className="flex items-stretch overflow-hidden rounded-md border border-border-strong bg-surface transition-[border-color,box-shadow] duration-150 ease-out-quart focus-within:border-accent focus-within:ring-2 focus-within:ring-accent">
        <button
          type="button"
          aria-label="Decrease"
          onClick={() => set(value - step)}
          disabled={value <= min}
          className={`${stepBtn} border-r border-border`}
        >
          <Minus />
        </button>
        <div className="flex flex-1 items-baseline justify-center gap-1 px-1 py-2">
          <input
            id={id}
            type="number"
            inputMode="decimal"
            step={step}
            min={min}
            max={max}
            value={value}
            onChange={(e) => {
              const raw = parseFloat(e.target.value);
              onChange(clamp(raw, min, max));
            }}
            style={{ width: `${valueWidthCh}ch` }}
            className="border-0 bg-transparent p-0 text-right font-mono text-[0.8125rem] tabular-nums text-ink outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="font-mono text-[0.8125rem] text-ink-secondary">
            {unit}
          </span>
        </div>
        <button
          type="button"
          aria-label="Increase"
          onClick={() => set(value + step)}
          disabled={value >= max}
          className={`${stepBtn} border-l border-border`}
        >
          <Plus />
        </button>
      </div>
      {hint && <p className="text-xs text-ink-secondary">{hint}</p>}
    </div>
  );
}

/* ── inline icons (16px, stroke=currentColor) ─────────────────────────────── */
function Minus() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Plus() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 5v14M5 12h14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
