import { useState } from "react";
import type { SheetState } from "../types";
import { download, exportFilename, generatePdf, printPdf } from "../lib/pdf";
import { Button } from "./ui";

interface Props {
  state: SheetState;
}

export default function ExportBar({ state }: Props) {
  const [busy, setBusy] = useState<null | "print" | "export">(null);
  const [error, setError] = useState<string | null>(null);

  const activeImages = state.images.filter(
    (img) => !state.disabledQuadrants.includes(img.quadrant),
  );
  const canExport = activeImages.length > 0;

  const handlePrint = async () => {
    setError(null);
    setBusy("print");
    try {
      const bytes = await generatePdf(state);
      await printPdf(bytes);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to print.");
    } finally {
      setBusy(null);
    }
  };

  const handleExport = async () => {
    setError(null);
    setBusy("export");
    try {
      const bytes = await generatePdf(state);
      download(bytes, exportFilename());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate PDF.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        variant="primary"
        onClick={handlePrint}
        disabled={!canExport || busy !== null}
        className="w-full"
      >
        <PrintIcon />
        {busy === "print" ? "Preparing…" : "Print"}
      </Button>
      <Button
        variant="secondary"
        onClick={handleExport}
        disabled={!canExport || busy !== null}
        className="w-full"
      >
        {busy === "export" ? "Exporting…" : "Export PDF"}
      </Button>
      {!canExport && (
        <p className="text-xs text-ink-secondary">
          Add at least one image to an enabled quadrant to print or export.
        </p>
      )}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

function PrintIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5a1 1 0 0 1-1 1h-2M6 14h12v7H6z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
