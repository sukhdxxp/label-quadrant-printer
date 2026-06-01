import type { LabelImage, Rotation } from "../types";

interface Props {
  image: LabelImage;
  onChange: (patch: Partial<LabelImage>) => void;
  onRemove: () => void;
}

const OFFSET_MIN = -20;
const OFFSET_MAX = 20;

function nextRotation(r: Rotation): Rotation {
  return (((r + 90) % 360) as Rotation);
}

function clampOffset(v: number): number {
  if (Number.isNaN(v)) return 0;
  return Math.max(OFFSET_MIN, Math.min(OFFSET_MAX, v));
}

export default function ImageControls({ image, onChange, onRemove }: Props) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-800">
          Quadrant {image.quadrant}
        </h3>
        <button
          type="button"
          onClick={onRemove}
          className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
        >
          Remove
        </button>
      </div>

      <p className="mt-1 truncate text-xs text-slate-500" title={image.file.name}>
        {image.file.name} · {image.naturalWidth}×{image.naturalHeight}px
      </p>

      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange({ rotation: nextRotation(image.rotation) })}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Rotate ↻
        </button>
        <span className="text-sm text-slate-600">{image.rotation}°</span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <label className="block text-xs font-medium text-slate-600">
          Offset X (mm)
          <input
            type="number"
            step={0.5}
            min={OFFSET_MIN}
            max={OFFSET_MAX}
            value={image.offsetX}
            onChange={(e) =>
              onChange({ offsetX: clampOffset(parseFloat(e.target.value)) })
            }
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
        </label>
        <label className="block text-xs font-medium text-slate-600">
          Offset Y (mm)
          <input
            type="number"
            step={0.5}
            min={OFFSET_MIN}
            max={OFFSET_MAX}
            value={image.offsetY}
            onChange={(e) =>
              onChange({ offsetY: clampOffset(parseFloat(e.target.value)) })
            }
            className="mt-1 w-full rounded-md border border-slate-300 px-2 py-1 text-sm"
          />
        </label>
      </div>
    </div>
  );
}
