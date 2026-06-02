import { useCallback, useRef, useState, type ReactNode } from "react";
import { v4 as uuidv4 } from "uuid";
import type { LabelImage, Quadrant, SheetState } from "../types";
import {
  prepareSourceForEditor,
  type EditorSource,
  type LoadedImage,
} from "../lib/fileLoading";
import type { EditedImage } from "../lib/imageEditing";
import { bestFitRotation } from "../lib/placement";
import SheetPreview from "./SheetPreview";
import QuadrantSelector from "./QuadrantSelector";
import CropRotateModal from "./CropRotateModal";
import ImageControls from "./ImageControls";
import MarginControl from "./MarginControl";
import ExportBar from "./ExportBar";
import PrintHelp from "./PrintHelp";
import UploadView from "./UploadView";
import Stepper, { type WizardStep } from "./Stepper";
import { Button } from "./ui";

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
  // True while re-editing an already-placed photo (vs. adding a new one), so we
  // keep the current cell selected instead of advancing to the next free one.
  const reediting = useRef(false);

  const occupied = state.images.map((i) => i.quadrant);

  // Step 1: an uploaded file (PDF or image) is normalised into an editor source.
  const handleFileSelected = useCallback(async (file: File) => {
    reediting.current = false;
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
    (
      quadrant: Quadrant,
      file: File,
      loaded: LoadedImage,
      source: EditorSource,
      advance: boolean,
    ) => {
      setState((prev) => {
        const existing = prev.images.find((i) => i.quadrant === quadrant);
        // Fresh upload: auto-rotate a landscape crop to fill the portrait cell.
        // Re-edit: keep whatever rotation the user already dialled in.
        const rotation = advance
          ? bestFitRotation(
              loaded.naturalWidth,
              loaded.naturalHeight,
              prev.safetyMargin,
            )
          : existing?.rotation ?? 0;
        const next: LabelImage = {
          id: uuidv4(),
          quadrant,
          file,
          dataUrl: loaded.dataUrl,
          naturalWidth: loaded.naturalWidth,
          naturalHeight: loaded.naturalHeight,
          fit: "contain",
          source,
          rotation,
          // preserved fields (or defaults on first placement)
          offsetX: existing?.offsetX ?? 0,
          offsetY: existing?.offsetY ?? 0,
        };
        const images = prev.images.filter((i) => i.quadrant !== quadrant);
        images.push(next);

        // After a fresh upload, target the next free cell; after a re-edit,
        // stay on the cell that was just edited.
        if (advance) {
          const occ = images.map((i) => i.quadrant);
          setSelectedQuadrant(nextFreeQuadrant(occ, quadrant));
        }

        return { ...prev, images };
      });
    },
    [],
  );

  // Step 2 → done: the cropped + rotated PNG is placed, then we show the layout.
  const handleEdited = useCallback(
    (edited: EditedImage) => {
      if (!editorSource) return;
      placeImage(
        selectedQuadrant,
        edited.file,
        {
          dataUrl: edited.dataUrl,
          naturalWidth: edited.naturalWidth,
          naturalHeight: edited.naturalHeight,
        },
        editorSource,
        !reediting.current,
      );
      reediting.current = false;
      setEditorSource(null);
      setStep("workspace");
    },
    [placeImage, selectedQuadrant, editorSource],
  );

  // Re-open Crop & rotate for the photo in the selected quadrant, from the
  // stored original source so re-cropping never compounds a previous crop.
  const editCurrent = useCallback(() => {
    const img = state.images.find((i) => i.quadrant === selectedQuadrant);
    if (!img) return;
    reediting.current = true;
    setUploadError(null);
    setEditorSource(img.source);
    setStep("edit");
  }, [state.images, selectedQuadrant]);

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
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border bg-surface px-5 py-3 sm:px-6">
        <div>
          <h1 className="text-[1.0625rem] font-semibold tracking-[-0.01em] text-ink">
            Label Quadrant Printer
          </h1>
          <p className="mt-0.5 text-xs text-ink-secondary">
            A4 TownStix 4-up, 105 × 148.5 mm cells, export at 100% scale
          </p>
        </div>
        <Stepper current={step} />
      </header>

      {step === "upload" && (
        <UploadView
          onFileSelected={handleFileSelected}
          preparing={preparing}
          error={uploadError}
          targetQuadrant={selectedQuadrant}
          onCancel={
            state.images.length > 0 ? () => setStep("workspace") : undefined
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
        <div className="view-enter flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
          {/* Controls */}
          <aside className="flex w-full shrink-0 flex-col gap-6 border-t border-border bg-surface p-5 lg:w-[332px] lg:overflow-y-auto lg:border-r lg:border-t-0">
            <div>
              <Button
                variant="secondary"
                onClick={startAddAnother}
                disabled={allFull}
                className="w-full"
              >
                Add another photo
              </Button>
              {allFull && (
                <p className="mt-2 text-xs text-ink-secondary">
                  All four quadrants are filled. Pick a cell below to replace
                  one.
                </p>
              )}
            </div>

            <Section title="Target quadrant">
              <QuadrantSelector
                selected={selectedQuadrant}
                occupied={occupied}
                disabled={state.disabledQuadrants}
                onSelect={setSelectedQuadrant}
                onToggleDisabled={toggleDisabled}
              />
            </Section>

            {selectedImage && (
              <Section title="Adjust placement">
                <ImageControls
                  image={selectedImage}
                  onChange={(patch) => updateImage(selectedImage.id, patch)}
                  onEdit={editCurrent}
                  onRemove={() => removeImage(selectedImage.id)}
                />
              </Section>
            )}

            <Section title="Safety margin">
              <MarginControl value={state.safetyMargin} onChange={setMargin} />
            </Section>

            <Section title="Export">
              <ExportBar state={state} />
              <PrintHelp />
            </Section>
          </aside>

          {/* Preview */}
          <main className="order-first flex min-h-[60vh] flex-1 flex-col p-4 sm:p-6 lg:order-none lg:min-h-0">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium tracking-[0.01em] text-ink-secondary">
                Preview
              </span>
              <label className="flex cursor-pointer select-none items-center gap-2 text-xs text-ink-secondary">
                <input
                  type="checkbox"
                  checked={showRuler}
                  onChange={(e) => setShowRuler(e.target.checked)}
                  className="size-3.5 rounded-[3px] accent-accent"
                />
                mm ruler ticks
              </label>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center rounded-lg bg-sunken p-4 sm:p-6">
              <div
                className="max-h-full shadow-raised"
                style={{ aspectRatio: "210 / 297", height: "100%" }}
              >
                <SheetPreview
                  state={state}
                  selectedQuadrant={selectedQuadrant}
                  showRuler={showRuler}
                  onSelectQuadrant={setSelectedQuadrant}
                />
              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-tertiary">
        {title}
      </h2>
      {children}
    </section>
  );
}
