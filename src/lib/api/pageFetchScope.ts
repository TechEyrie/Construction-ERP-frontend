/**
 * Tracks in-flight page data fetches so sidebar navigation can abort them
 * even if a previous page instance is slow to unmount.
 */
const controllers = new Set<AbortController>();

/** Register a page-load controller; aborted automatically on navAwayAllPageFetches(). */
export function trackPageFetch(ac: AbortController): () => void {
  controllers.add(ac);
  return () => {
    controllers.delete(ac);
  };
}

/** Abort every tracked page fetch (call on sidebar section change). */
export function navAwayAllPageFetches(): void {
  for (const ac of controllers) {
    try {
      ac.abort();
    } catch {
      /* ignore */
    }
  }
  controllers.clear();
}
