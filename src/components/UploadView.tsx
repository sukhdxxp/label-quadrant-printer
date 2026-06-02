import ImageDropzone from "./ImageDropzone";

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
    <div className="flex h-full w-full items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-800">
            Upload a label
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Choose a photo or PDF to place on the sheet.
            {targetQuadrant ? (
              <>
                {" "}
                It will go into{" "}
                <span className="font-medium text-slate-700">
                  quadrant {targetQuadrant}
                </span>
                .
              </>
            ) : null}
          </p>
        </div>

        <div className="mt-6">
          <ImageDropzone onFileSelected={onFileSelected} large />
        </div>

        {preparing && (
          <p className="mt-3 text-center text-sm text-slate-500">
            Preparing file…
          </p>
        )}
        {error && (
          <p className="mt-3 text-center text-sm text-red-600">{error}</p>
        )}

        {onCancel && (
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-md px-4 py-2 text-sm font-medium text-slate-500 hover:bg-slate-100"
            >
              ← Back to layout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
