import { useState } from "react";
import { download, generateCalibrationPdf } from "../lib/pdf";
import { Button } from "./ui";
import Dialog from "./Dialog";

const CHECKLIST: { text: React.ReactNode }[] = [
  { text: "Open the PDF in Acrobat or Preview." },
  { text: "Paper size: A4." },
  {
    text: (
      <>
        Scale:{" "}
        <strong className="font-semibold text-ink">100% / Actual size</strong>{" "}
        <span className="text-warning-ink">(never "Fit to page")</span>.
      </>
    ),
  },
  { text: "Margins: none." },
  { text: "Test on plain A4 first; hold it against the label sheet to check." },
];

export default function PrintHelp() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalibration = async () => {
    setError(null);
    setBusy(true);
    try {
      const bytes = await generateCalibrationPdf();
      download(bytes, "calibration-A4-4up.pdf");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Failed to generate calibration sheet.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 self-start rounded-sm text-sm font-medium text-accent transition-colors duration-150 ease-out-quart hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <HelpIcon />
        How to print accurately
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="How to print accurately"
      >
        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-2.5">
            <p className="text-sm leading-relaxed text-ink-secondary">
              The exported sheet is sized to the millimeter. To make the print
              match the preview, use these settings:
            </p>
            <ul role="list" className="flex flex-col gap-2">
              {CHECKLIST.map((item, i) => (
                <li key={i} className="flex gap-2.5 text-sm text-ink-secondary">
                  <span
                    className="mt-[7px] size-1 shrink-0 rounded-full bg-ink-tertiary"
                    aria-hidden="true"
                  />
                  <span className="leading-relaxed">{item.text}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="h-px bg-border" aria-hidden="true" />

          <section className="flex flex-col gap-2.5">
            <h3 className="text-sm font-semibold text-ink">Calibration sheet</h3>
            <p className="text-sm leading-relaxed text-ink-secondary">
              Print a calibration sheet on plain A4 and hold it against your
              label stock to confirm your printer's alignment before committing a
              real sheet.
            </p>
            <Button
              variant="secondary"
              onClick={handleCalibration}
              disabled={busy}
              className="self-start"
            >
              {busy ? "Generating…" : "Generate calibration sheet"}
            </Button>
            {error && <p className="text-xs text-danger">{error}</p>}
          </section>
        </div>
      </Dialog>
    </>
  );
}

function HelpIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="17" r="0.4" fill="currentColor" stroke="currentColor" />
    </svg>
  );
}
