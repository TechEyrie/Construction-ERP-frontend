"use client";

import { useEffect, useRef } from "react";
import { isAbortError } from "@/lib/api/abort";
import { trackPageFetch } from "@/lib/api/pageFetchScope";

/**
 * Runs an async loader with AbortController. Abort on unmount / dep change
 * so leaving a page cancels in-flight HTTP instead of blocking the next page.
 */
export function useAbortableLoad(
  deps: unknown[],
  load: (signal: AbortSignal) => Promise<void>
): void {
  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    const ac = new AbortController();
    const untrack = trackPageFetch(ac);
    void loadRef.current(ac.signal).catch((e) => {
      if (ac.signal.aborted || isAbortError(e)) return;
      console.error(e);
    });
    return () => {
      ac.abort();
      untrack();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller owns deps list
  }, deps);
}
