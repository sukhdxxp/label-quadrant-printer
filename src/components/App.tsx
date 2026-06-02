import { useCallback, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { LabelImage, Quadrant, SheetState } from "../types";
import {
  prepareSourceForEditor,
  type EditorSource,
  type LoadedImage,
} from "../lib/fileLoading";
import type { EditedImage } from "../lib/imageEditing";
import SheetPreview from "./SheetPreview";
import QuadrantSelector from "./QuadrantSelector";
import CropRotateModal from "./CropRotateModal";
import ImageControls from "./ImageControls";
import MarginControl from "./MarginControl";
import ExportBar from "./ExportBar";
import PrintInstructions from "./PrintInstructions";
import UploadView from "./UploadView";
import Stepper, { type WizardStep } from "./Stepper";

const ALL_QUADRANTS: Quadrant[] = [1, 2, 3, 4];

/** First free quadrant at or after `from`, wrapping around; falls back to `from`. */
function nextFreeQuadrant(occupied: Quadrant[], from: Quadrant): Quadrant {
  for (let i = 0; i < 4; i++) {
    const q = (((from - 1 + i) % 4) + 1) as Quadrant;
    if (!occupied.includes(q)) return q;
  }
  return from;
}

export default function App() {
  const [state, setState] = useState<SheetState>({
    images: [],
    disabledQuadrants: [],
    safetyMargin: 2,
  });
  const [selectedQuadrant, setSelectedQuadrant] = useState<Quadrant>(1);
  const [step, setStep] = useState<WizardStep>("upload");
  const [showRuler, setShowRuler] = useState(false);
  const [editorSource, setEditorSource] = useState<EditorSource | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const occupied = state.images.map((i) => i.quadrant);

  // Step 1: an uploaded file (PDF or image) is normalised into an editor source.
  const handleFileSelected = useCallback(async (file: File) => {
    setUploadError(null);
    setPreparing(true);
    try {
      const source = await prepareSourceForEditor(file);
      setEditorSource(source);
      setStep("edit");
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "Could not read file.");
    } finally {
      setPreparing(false);
    }
  }, []);

  const placeImage = useCallback(
    (quadrant: Quadrant, file: File, loaded: LoadedImage) => {
      setState((prev) => {
        const existing = prev.images.find((i) => i.quadrant === quadrant);
        const next: LabelImage = {
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

        // Default the target to the next free cell for the following upload.
        const occ = images.map((i) => i.quadrant);
        setSelectedQuadrant(nextFreeQuadrant(occ, quadrant));

        return { ...prev, images };
      });
    },
    [],
  );

  // Step 2 → done: the cropped + rotated PNG is placed, then we show the layout.
  const handleEdited = useCallback(
    (edited: EditedImage) => {
      placeImage(selectedQuadrant, edited.file, {
        dataUrl: edited.dataUrl,
        naturalWidth: edited.naturalWidth,
        naturalHeight: edited.naturalHeight,
      });
      setEditorSource(null);
      setStep("workspace");
    },
    [placeImage, selectedQuadrant],
  );

  const cancelEdit = useCallback(() => {
    setEditorSource(null);
    setStep(state.images.length > 0 ? "workspace" : "upload");
  }, [state.images.length]);

  // Step 4: start onboarding another photo into the next free quadrant.
  const startAddAnother = useCallback(() => {
    setUploadError(null);
    setSelectedQuadrant((cur) => nextFreeQuadrant(occupied, cur));
    setStep("upload");
  }, [occupied]);

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
  const allFull = occupied.length >= ALL_QUADRANTS.length;

  return (
    <div className="flex h-full flex-col bg-slate-100 text-slate-900">
      <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-3">
        <div>
          <h1 className="text-lg font-bold">Label Quadrant Printer</h1>
          <p className="text-xs text-slate-500">
            A4 TownStix 4-up · 105 × 148.5 mm cells · export at 100% scale
          </p>
        </div>
        <Stepper current={step} />
      </header>

      <div className="flex flex-1 overflow-hidden">
        {step === "upload" && (
          <UploadView
            onFileSelected={handleFileSelected}
            preparing={preparing}
            error={uploadError}
            targetQuadrant={selectedQuadrant}
            onCancel={
              state.images.length > 0
                ? () => setStep("workspace")
                : undefined
            }
          />
        )}

        {step === "edit" && editorSource && (
          <CropRotateModal
            source={editorSource}
            onConfirm={handleEdited}
            onCancel={cancelEdit}
          />
        )}

        {step === "workspace" && (
          <>
            {/* Sidebar */}
            <aside className="w-[300px] shrink-0 space-y-5 overflow-y-auto border-r border-slate-200 bg-white p-4">
              <button
                type="button"
                onClick={startAddAnother}
                disabled={allFull}
                className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                + Add another photo
              </button>
              {allFull && (
                <p className="-mt-3 text-xs text-slate-500">
                  All four quadrants are filled. Pick a cell below to replace it.
                </p>
              )}

              <section>
                <h2 className="mb-2 text-sm font-semibold text-slate-800">
                  Target quadrant
                </h2>
                <QuadrantSelector
                  selected={selectedQuadrant}
                  occupied={occupied}
                  disabled={state.disabledQuadrants}
                  onSelect={setSelectedQuadrant}
                  onToggleDisabled={toggleDisabled}
                />
              </section>

              {selectedImage && (
                <section>
                  <h2 className="mb-2 text-sm font-semibold text-slate-800">
                    Adjust placement
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
                <span className="text-sm font-medium text-slate-600">
                  Preview
                </span>
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
          </>
        )}
      </div>
    </div>
  );
}
