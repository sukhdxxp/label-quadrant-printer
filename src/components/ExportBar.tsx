import { useState } from "react";
import type { SheetState } from "../types";
import {
  download,
  exportFilename,
  generateCalibrationPdf,
  generatePdf,
} from "../lib/pdf";

interface Props {
  state: SheetState;
}

export default function ExportBar({ state }: Props) {
  const [busy, setBusy] = useState<null | "labels" | "calibration">(null);
  const [error, setError] = useState<string | null>(null);

  const activeImages = state.images.filter(
    (img) => !state.disabledQuadrants.includes(img.quadrant),
  );
  const canExport = activeImages.length > 0;

  const handleLabels = async () => {
    setError(null);
    setBusy("labels");
    try {
      const bytes = await generatePdf(state);
      download(bytes, exportFilename());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate PDF.");
    } finally {
      setBusy(null);
    }
  };

  const handleCalibration = async () => {
    setError(null);
    setBusy("calibration");
    try {
      const bytes = await generateCalibrationPdf();
      download(bytes, "calibration-A4-4up.pdf");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to generate calibration sheet.",
      );
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleLabels}
        disabled={!canExport || busy !== null}
        className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {busy === "labels" ? "Generating…" : "Generate PDF"}
      </button>
      <button
        type="button"
        onClick={handleCalibration}
        disabled={busy !== null}
        className="w-full rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy === "calibration" ? "Generating…" : "Generate calibration sheet"}
      </button>
      {!canExport && (
        <p className="text-xs text-slate-500">
          Add at least one image to an enabled quadrant to export.
        </p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
