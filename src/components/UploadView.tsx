import ImageDropzone from "./ImageDropzone";
import { Button } from "./ui";

interface Props {
  onFileSelected: (file: File) => void;
  preparing: boolean;
  error: string | null;
  /** Shown only when at least one label has already been placed. */
  onCancel?: () => void;
  targetQuadrant?: number;
}

export default function UploadView({
  onFileSelected,
  preparing,
  error,
  onCancel,
  targetQuadrant,
}: Props) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-6">
      <div className="view-enter w-full max-w-md">
        <div className="text-center">
          <h2 className="text-[1.125rem] font-semibold tracking-[-0.005em] text-ink">
            Upload a label
          </h2>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-secondary">
            Choose a photo or PDF to place on the sheet.
            {targetQuadrant ? (
              <>
                {" "}
                It goes into{" "}
                <span className="font-mono text-[0.8125rem] font-medium text-ink">
                  Q{targetQuadrant}
                </span>
                .
              </>
            ) : null}
          </p>
        </div>

        <div className="mt-6">
          <ImageDropzone onFileSelected={onFileSelected} large />
        </div>

        <div className="mt-3 min-h-5 text-center text-sm" aria-live="polite">
          {preparing && (
            <span className="inline-flex items-center gap-2 text-ink-secondary">
              <Spinner />
              Preparing file
            </span>
          )}
          {error && !preparing && <span className="text-danger">{error}</span>}
        </div>

        {onCancel && (
          <div className="mt-4 text-center">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Back to layout
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      className="size-4 animate-spin text-ink-tertiary"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.5"
        className="opacity-25"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
