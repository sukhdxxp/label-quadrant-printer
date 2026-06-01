import { useCallback, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { LabelImage, Quadrant, SheetState } from "../types";
import type { LoadedImage } from "../lib/fileLoading";
import SheetPreview from "./SheetPreview";
import QuadrantSelector from "./QuadrantSelector";
import ImageDropzone from "./ImageDropzone";
import ImageControls from "./ImageControls";
import MarginControl from "./MarginControl";
import ExportBar from "./ExportBar";
import PrintInstructions from "./PrintInstructions";

const ALL_QUADRANTS: Quadrant[] = [1, 2, 3, 4];

export default function App() {
  const [state, setState] = useState<SheetState>({
    images: [],
    disabledQuadrants: [],
    safetyMargin: 2,
  });
  const [selectedQuadrant, setSelectedQuadrant] = useState<Quadrant>(1);
  const [showRuler, setShowRuler] = useState(false);
  const [pending, setPending] = useState<{
    file: File;
    loaded: LoadedImage;
  } | null>(null);

  const occupied = state.images.map((i) => i.quadrant);

  const placeImage = useCallback(
    (quadrant: Quadrant, file: File, loaded: LoadedImage) => {
      setState((prev) => {
        const existing = prev.images.find((i) => i.quadrant === quadrant);
        const next: LabelImage = {
          // refreshed fields
          id: uuidv4(),
          quadrant,
          file,
          dataUrl: loaded.dataUrl,
          naturalWidth: loaded.naturalWidth,
          naturalHeight: loaded.naturalHeight,
          fit: "contain",
          // preserved fields (or defaults on first placement)
          rotation: existing?.rotation ?? 0,
          offsetX: existing?.offsetX ?? 0,
          offsetY: existing?.offsetY ?? 0,
        };
        const images = prev.images.filter((i) => i.quadrant !== quadrant);
        images.push(next);
        return { ...prev, images };
      });
      setSelectedQuadrant(quadrant);
    },
    [],
  );

  const onImageLoaded = useCallback(
    (file: File, loaded: LoadedImage) => {
      // If the selected quadrant is free, place straight away; otherwise ask.
      const isFree = !occupied.includes(selectedQuadrant);
      if (isFree) {
        placeImage(selectedQuadrant, file, loaded);
      } else {
        setPending({ file, loaded });
      }
    },
    [occupied, selectedQuadrant, placeImage],
  );

  const updateImage = (id: string, patch: Partial<LabelImage>) =>
    setState((prev) => ({
      ...prev,
      images: prev.images.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }));

  const removeImage = (id: string) =>
    setState((prev) => ({
      ...prev,
      images: prev.images.filter((i) => i.id !== id),
    }));

  const toggleDisabled = (q: Quadrant) =>
    setState((prev) => ({
      ...prev,
      disabledQuadrants: prev.disabledQuadrants.includes(q)
        ? prev.disabledQuadrants.filter((x) => x !== q)
        : [...prev.disabledQuadrants, q],
    }));

  const setMargin = (mm: number) =>
    setState((prev) => ({ ...prev, safetyMargin: mm }));

  const selectedImage = state.images.find(
    (i) => i.quadrant === selectedQuadrant,
  );

  return (
    <div className="flex h-full flex-col bg-slate-100 text-slate-900">
      <header className="border-b border-slate-200 bg-white px-6 py-3">
        <h1 className="text-lg font-bold">Label Quadrant Printer</h1>
        <p className="text-xs text-slate-500">
          A4 TownStix 4-up · 105 × 148.5 mm cells · export at 100% scale
        </p>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[360px] shrink-0 space-y-4 overflow-y-auto border-r border-slate-200 bg-white p-4">
          <section>
            <h2 className="mb-2 text-sm font-semibold text-slate-800">
              1 · Target quadrant
            </h2>
            <QuadrantSelector
              selected={selectedQuadrant}
              occupied={occupied}
              disabled={state.disabledQuadrants}
              onSelect={setSelectedQuadrant}
              onToggleDisabled={toggleDisabled}
            />
          </section>

          <section>
            <h2 className="mb-2 text-sm font-semibold text-slate-800">
              2 · Upload image
            </h2>
            <ImageDropzone onImageLoaded={onImageLoaded} />
          </section>

          {selectedImage && (
            <section>
              <h2 className="mb-2 text-sm font-semibold text-slate-800">
                3 · Adjust placement
              </h2>
              <ImageControls
                image={selectedImage}
                onChange={(patch) => updateImage(selectedImage.id, patch)}
                onRemove={() => removeImage(selectedImage.id)}
              />
            </section>
          )}

          <section>
            <MarginControl value={state.safetyMargin} onChange={setMargin} />
          </section>

          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-800">Export</h2>
            <ExportBar state={state} />
            <PrintInstructions />
          </section>
        </aside>

        {/* Preview */}
        <main className="flex flex-1 flex-col overflow-hidden p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">Preview</span>
            <label className="flex items-center gap-1.5 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={showRuler}
                onChange={(e) => setShowRuler(e.target.checked)}
              />
              mm ruler ticks
            </label>
          </div>
          <div className="flex flex-1 items-center justify-center overflow-hidden rounded-lg bg-slate-200 p-4">
            <div className="h-full" style={{ aspectRatio: "210 / 297" }}>
              <SheetPreview
                state={state}
                selectedQuadrant={selectedQuadrant}
                showRuler={showRuler}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Quadrant picker modal (shown when target is occupied) */}
      {pending && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-lg bg-white p-5 shadow-xl">
            <h2 className="text-base font-semibold text-slate-800">
              Place image into which quadrant?
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Occupied quadrants will be replaced (rotation &amp; offsets kept).
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {ALL_QUADRANTS.map((q) => {
                const isOccupied = occupied.includes(q);
                const isDisabled = state.disabledQuadrants.includes(q);
                return (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                      placeImage(q, pending.file, pending.loaded);
                      setPending(null);
                    }}
                    className="rounded-md border border-slate-300 px-3 py-3 text-sm font-medium text-slate-700 hover:border-blue-500 hover:bg-blue-50"
                  >
                    Q{q}
                    <span className="ml-1 text-xs font-normal text-slate-400">
                      {isDisabled ? "(disabled)" : isOccupied ? "(replace)" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setPending(null)}
              className="mt-4 w-full rounded-md px-3 py-2 text-sm text-slate-500 hover:bg-slate-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
