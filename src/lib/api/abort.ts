/** True when fetch/promise was aborted (nav away, Strict Mode remount, etc.). */
export function isAbortError(err: unknown): boolean {
  if (err == null) return false;
  if (typeof DOMException !== "undefined" && err instanceof DOMException && err.name === "AbortError") {
    return true;
  }
  if (err instanceof Error && (err.name === "AbortError" || /aborted|AbortError/i.test(err.message))) {
    return true;
  }
  return false;
}
