import type { Focus } from "./store.ts";

const FOCUS_ORDER: Focus[] = ["sources", "items", "details"];

export function focusNext(current: Focus): Focus {
  const idx = FOCUS_ORDER.indexOf(current);
  if (idx === -1 || idx === FOCUS_ORDER.length - 1) {
    return FOCUS_ORDER[0];
  }
  return FOCUS_ORDER[idx + 1];
}

export function focusPrev(current: Focus): Focus {
  const idx = FOCUS_ORDER.indexOf(current);
  if (idx <= 0) {
    return FOCUS_ORDER[FOCUS_ORDER.length - 1];
  }
  return FOCUS_ORDER[idx - 1];
}
