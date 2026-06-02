import type { LabelImage, Rotation } from "../types";
import { Button, MeasurementField } from "./ui";

interface Props {
  image: LabelImage;
  onChange: (patch: Partial<LabelImage>) => void;
  onEdit: () => void;
  onRemove: () => void;
}

const OFFSET_MIN = -20;
const OFFSET_MAX = 20;

function nextRotation(r: Rotation): Rotation {
  return ((r + 90) % 360) as Rotation;
}

export default function ImageControls({
  image,
  onChange,
  onEdit,
  onRemove,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p
            className="truncate text-sm font-medium text-ink"
            title={image.file.name}
          >
            {image.file.name}
          </p>
          <p className="mt-0.5 font-mono text-[0.75rem] tabular-nums text-ink-tertiary">
            {image.naturalWidth} × {image.naturalHeight} px
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-danger transition-colors duration-150 ease-out-quart hover:bg-danger-weak focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger"
        >
          Remove
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={onEdit}>
          <CropIcon />
          Edit
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onChange({ rotation: nextRotation(image.rotation) })}
        >
          <RotateIcon />
          Rotate 90°
        </Button>
        <span className="ml-auto font-mono text-[0.8125rem] tabular-nums text-ink-secondary">
          {image.rotation}°
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <MeasurementField
          label="Offset X"
          unit="mm"
          value={image.offsetX}
          min={OFFSET_MIN}
          max={OFFSET_MAX}
          step={0.5}
          onChange={(v) => onChange({ offsetX: v })}
        />
        <MeasurementField
          label="Offset Y"
          unit="mm"
          value={image.offsetY}
          min={OFFSET_MIN}
          max={OFFSET_MAX}
          step={0.5}
          onChange={(v) => onChange({ offsetY: v })}
        />
      </div>
    </div>
  );
}

function CropIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 2v14a2 2 0 0 0 2 2h14M2 6h14a2 2 0 0 1 2 2v14"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RotateIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M21 12a9 9 0 1 1-3-6.7M21 4v4h-4"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
