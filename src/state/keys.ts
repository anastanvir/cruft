export type KeyAction =
  | "navigate-up"
  | "navigate-down"
  | "navigate-left"
  | "navigate-right"
  | "page-up"
  | "page-down"
  | "home"
  | "end"
  | "toggle-select"
  | "select-all"
  | "clear-selection"
  | "invert-selection"
  | "select-safe"
  | "delete"
  | "undo"
  | "sort"
  | "filter"
  | "filter-safe"
  | "search"
  | "rescan"
  | "toggle-density"
  | "help"
  | "escape"
  | "quit";

export const DEFAULT_KEYBINDINGS: Record<string, KeyAction> = {
  up: "navigate-up",
  down: "navigate-down",
  left: "navigate-left",
  right: "navigate-right",
  pageup: "page-up",
  pagedown: "page-down",
  home: "home",
  end: "end",
  " ": "toggle-select",
  a: "select-all",
  A: "clear-selection",
  i: "invert-selection",
  S: "select-safe",
  d: "delete",
  u: "undo",
  s: "sort",
  f: "filter",
  "!": "filter-safe",
  "/": "search",
  r: "rescan",
  c: "toggle-density",
  "?": "help",
  escape: "escape",
  q: "quit",
};
