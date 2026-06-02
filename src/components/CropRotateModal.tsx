import { useCallback, useState } from "react";
import Cropper from "react-easy-crop";
import "react-easy-crop/react-easy-crop.css";
import { CELL_W_MM, CELL_H_MM } from "../lib/placement";
import { cropImage, type CropArea, type EditedImage } from "../lib/imageEditing";
import type { EditorSource } from "../lib/fileLoading";
import type { Rotation } from "../types";

const CELL_ASPECT = CELL_W_MM / CELL_H_MM;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;

interface Props {
  source: EditorSource;
  onConfirm: (edited: EditedImage) => void;
  onCancel: () => void;
}

export default function CropRotateModal({
  source,
  onConfirm,
  onCancel,
}: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState<Rotation>(0);
  const [locked, setLocked] = useState(true);
  const [area, setArea] = useState<CropArea | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCropComplete = useCallback((_: unknown, areaPixels: CropArea) => {
    setArea(areaPixels);
  }, []);

  const rotate = () => setRotation((r) => (((r + 90) % 360) as Rotation));

  const confirm = async () => {
    if (!area) return;
    setBusy(true);
    setError(null);
    try {
      const edited = await cropImage(source, area, rotation);
      onConfirm(edited);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not crop image.");
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full w-full items-center justify-center p-4">
      <div className="flex h-full max-h-[760px] w-full max-w-3xl flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800">
          Crop &amp; rotate
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Drag to position, use the slider (or scroll/pinch) to zoom. Rotation is
          baked into the label.
        </p>

        <div className="relative my-4 flex-1 overflow-hidden rounded-md bg-slate-900">
          <Cropper
            image={source.dataUrl}
            crop={crop}
            zoom={zoom}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            rotation={rotation}
            aspect={locked ? CELL_ASPECT : undefined}
            restrictPosition={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        {/* Zoom slider */}
        <div className="mb-3 flex items-center gap-3">
          <span className="w-12 text-xs font-medium text-slate-600">Zoom</span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - 0.1).toFixed(2)))}
            className="flex h-6 w-6 items-center justify-center rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
            aria-label="Zoom out"
          >
            −
          </button>
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-blue-600"
            aria-label="Zoom"
          />
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.1).toFixed(2)))}
            className="flex h-6 w-6 items-center justify-center rounded border border-slate-300 text-slate-600 hover:bg-slate-50"
            aria-label="Zoom in"
          >
            +
          </button>
          <span className="w-10 text-right text-xs tabular-nums text-slate-400">
            {zoom.toFixed(1)}×
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-md border border-slate-300">
            <button
              type="button"
              onClick={() => setLocked(true)}
              className={`px-3 py-2 text-sm font-medium ${
                locked
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Lock to label
            </button>
            <button
              type="button"
              onClick={() => setLocked(false)}
              className={`px-3 py-2 text-sm font-medium ${
                !locked
                  ? "bg-blue-600 text-white"
                  : "bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Free
            </button>
          </div>

          <button
            type="button"
            onClick={rotate}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-blue-500 hover:bg-blue-50"
          >
            Rotate 90° ↻
          </button>

          <span className="ml-auto text-xs text-slate-400">{rotation}°</span>
        </div>

        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="rounded-md px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={busy || !area}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? "Processing…" : "Use this crop"}
          </button>
        </div>
      </div>
    </div>
  );
}
