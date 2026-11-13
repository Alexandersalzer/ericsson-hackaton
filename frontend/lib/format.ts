/** Small display helpers. Safe to use on server and client. */

/** 105000000 -> "105 MB", 152000 -> "0.15 MB", 1223051782 -> "1.2 GB". Decimal units, like Finder. */
export function formatBytes(bytes: number): string {
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  const mb = bytes / 1e6;
  if (mb >= 10) return `${Math.round(mb)} MB`;
  if (mb >= 0.01) return `${mb.toFixed(2).replace(/\.?0+$/, "")} MB`;
  return `${Math.max(1, Math.round(bytes / 1e3))} KB`;
}

/** 99.85 -> "99.8%". Floors so we never overstate the savings. */
export function formatPercent(percent: number): string {
  return `${(Math.floor(percent * 10) / 10).toFixed(1)}%`;
}

/** 245 -> "4:05", 3725 -> "1:02:05". */
export function formatDuration(seconds: number): string {
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = String(s % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

/** "Jury and prizes.mp4" -> "Jury and prizes", "ericsson_talk.mp4" -> "Ericsson talk". */
export function meetingTitle(fileName: string): string {
  const base = fileName.replace(/\.[^.]+$/, "").replace(/[_]+/g, " ").trim();
  return base.charAt(0).toUpperCase() + base.slice(1);
}

/** "en" -> "English". Falls back to the code if the browser/runtime doesn't know it. */
export function languageName(code: string): string {
  try {
    return new Intl.DisplayNames(["en"], { type: "language" }).of(code) ?? code;
  } catch {
    return code;
  }
}
