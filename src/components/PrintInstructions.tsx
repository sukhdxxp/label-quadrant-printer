export default function PrintInstructions() {
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
      <p className="font-semibold">Printing — read before you print</p>
      <ul className="mt-1 list-disc space-y-0.5 pl-4">
        <li>Open the PDF in Acrobat or Preview</li>
        <li>Paper: A4</li>
        <li>
          Scale: <strong>100% / Actual size</strong> — not “Fit to page”
        </li>
        <li>Margins: None</li>
        <li>Test on plain A4 first, hold against the label sheet to verify</li>
      </ul>
    </div>
  );
}
