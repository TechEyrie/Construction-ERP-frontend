"use client";

import { useSyncExternalStore } from "react";
import { getShellState, subscribeShell } from "./shellState";

export function useShellState() {
  return useSyncExternalStore(subscribeShell, getShellState, getShellState);
}
