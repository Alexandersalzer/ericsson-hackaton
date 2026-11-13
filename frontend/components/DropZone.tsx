"use client";

import { useRef, useState, type DragEvent } from "react";

const ACCEPTED_EXTENSIONS = [".mp4", ".mov"];

function isVideo(file: File) {
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

/**
 * The drop area. Accepts one MP4/MOV by drag-and-drop or click, and hands it to
 * `onFile`. It knows nothing about uploading or processing.
 */
export function DropZone({ onFile }: { onFile: (file: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function accept(file: File | undefined) {
    if (!file) return;
    if (!isVideo(file)) {
      setError(`${file.name} is not a video. Use an MP4 or MOV file.`);
      return;
    }
    setError(null);
    onFile(file);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault(); // stop the browser from opening the file in the tab
    setDragging(false);
    accept(e.dataTransfer.files[0]);
  }

  return (
    <div>
      {/* The whole card is one big button, so click and keyboard (Enter/Space) both work. */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault(); // required, otherwise the browser never fires "drop"
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`group flex w-full flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
          dragging ? "border-accent bg-accent-soft" : "border-line-strong bg-subtle hover:border-faint"
        }`}
      >
        <span
          className={`grid size-12 place-items-center rounded-lg border bg-background transition-colors ${
            dragging ? "border-accent text-accent" : "border-line text-ink group-hover:border-line-strong"
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 15V3M7 8l5-5 5 5M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          </svg>
        </span>
        <span className="mt-5 text-base font-medium">
          {dragging ? "Release to add the recording" : "Drop a meeting recording here"}
        </span>
        <span className="mt-1.5 text-muted">
          or <span className="font-medium text-ink underline decoration-line-strong underline-offset-4">browse files</span>
        </span>
        <span className="mt-5 font-mono text-xs text-faint">MP4 · MOV · original is kept, never deleted</span>
      </button>

      {error && (
        <p role="alert" className="mt-3 text-muted">
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/quicktime,.mp4,.mov"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          accept(e.target.files?.[0]);
          e.target.value = ""; // allow picking the same file again
        }}
      />
    </div>
  );
}
