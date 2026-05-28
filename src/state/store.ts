import { createStore } from "zustand";
import type { Item, Source } from "../scanners/types.ts";

export type Focus = "sources" | "items" | "details" | "modal";
export type ModalType = "confirm" | "filter" | "sort" | "search" | "help";

export interface Toast {
  id: string;
  kind: "info" | "success" | "warning" | "error";
  message: string;
  expiresAt: number;
}

export interface SortConfig {
  key: "size" | "name" | "lastUsed";
  dir: "asc" | "desc";
}

import type { RiskLevel } from "../scanners/types.ts";

export interface FilterConfig {
  minSize?: number;
  staleDays?: number;
  sources?: Source[];
  maxRisk?: RiskLevel;
}

export interface CruftState {
  items: Map<string, Item>;
  itemsBySource: Map<Source, string[]>;
  scannerStatus: Record<Source, "idle" | "running" | "done" | "unavailable" | "error">;
  scanErrors: Record<Source, string | undefined>;

  focus: Focus;
  modal: ModalType | null;
  activeSource: Source | "all";
  sort: SortConfig;
  filter: FilterConfig;
  search: string;
  cursor: string | null;
  density: "compact" | "comfortable";

  selection: Set<string>;
  toasts: Toast[];

  addItem(item: Item): void;
  addItems(items: Item[]): void;
  toggleSelect(id: string): void;
  selectVisible(itemIds: string[]): void;
  clearSelection(): void;
  invertSelection(allIds: string[]): void;
  setSort(s: Partial<SortConfig>): void;
  setFilter(f: Partial<FilterConfig>): void;
  setSearch(s: string): void;
  setCursor(id: string | null): void;
  setFocus(f: Focus): void;
  setModal(m: ModalType | null): void;
  setActiveSource(s: Source | "all"): void;
  setDensity(d: "compact" | "comfortable"): void;
  setScannerStatus(s: Source, status: CruftState["scannerStatus"][Source]): void;
  setScannerError(s: Source, error: string | undefined): void;
  pushToast(kind: Toast["kind"], message: string): void;
  dismissToast(id: string): void;
  reset(): void;
}

export function createCruftStore() {
  return createStore<CruftState>((set, _get) => ({
    items: new Map(),
    itemsBySource: new Map(),
    scannerStatus: {
      apps: "idle",
      homebrew: "idle",
      mas: "idle",
      "npm-global": "idle",
      docker: "idle",
      xcode: "idle",
      "node-modules": "idle",
      "version-managers": "idle",
      caches: "idle",
    },
    scanErrors: {
      apps: undefined,
      homebrew: undefined,
      mas: undefined,
      "npm-global": undefined,
      docker: undefined,
      xcode: undefined,
      "node-modules": undefined,
      "version-managers": undefined,
      caches: undefined,
    },

    focus: "items",
    modal: null,
    activeSource: "all",
    sort: { key: "size", dir: "desc" },
    filter: {},
    search: "",
    cursor: null,
    density: "compact",

    selection: new Set(),
    toasts: [],

    addItem(item: Item) {
      set((state) => {
        const items = new Map(state.items);
        items.set(item.id, item);

        const itemsBySource = new Map(state.itemsBySource);
        const existing = itemsBySource.get(item.source) ?? [];
        itemsBySource.set(item.source, [...existing, item.id]);

        return { items, itemsBySource };
      });
    },

    addItems(newItems: Item[]) {
      if (newItems.length === 0) return;
      set((state) => {
        const items = new Map(state.items);
        const itemsBySource = new Map(state.itemsBySource);
        for (const item of newItems) {
          items.set(item.id, item);
          const existing = itemsBySource.get(item.source) ?? [];
          itemsBySource.set(item.source, [...existing, item.id]);
        }
        return { items, itemsBySource };
      });
    },

    toggleSelect(id: string) {
      set((state) => {
        const selection = new Set(state.selection);
        if (selection.has(id)) {
          selection.delete(id);
        } else {
          selection.add(id);
        }
        return { selection };
      });
    },

    selectVisible(itemIds: string[]) {
      set((state) => {
        const selection = new Set(state.selection);
        for (const id of itemIds) {
          selection.add(id);
        }
        return { selection };
      });
    },

    clearSelection() {
      set({ selection: new Set() });
    },

    invertSelection(allIds: string[]) {
      set((state) => {
        const current = state.selection;
        const selection = new Set(allIds.filter((id) => !current.has(id)));
        return { selection };
      });
    },

    setSort(sort: Partial<SortConfig>) {
      set((state) => ({ sort: { ...state.sort, ...sort } }));
    },

    setFilter(filter: Partial<FilterConfig>) {
      set((state) => ({ filter: { ...state.filter, ...filter } }));
    },

    setSearch(search: string) {
      set({ search });
    },

    setCursor(cursor: string | null) {
      set({ cursor });
    },

    setFocus(focus: Focus) {
      set({ focus });
    },

    setModal(modal: ModalType | null) {
      set({ modal });
    },

    setActiveSource(activeSource: Source | "all") {
      set({ activeSource });
    },

    setDensity(density: "compact" | "comfortable") {
      set({ density });
    },

    setScannerStatus(source: Source, status: CruftState["scannerStatus"][Source]) {
      set((state) => ({
        scannerStatus: { ...state.scannerStatus, [source]: status },
      }));
    },

    setScannerError(source: Source, error: string | undefined) {
      set((state) => ({
        scanErrors: { ...state.scanErrors, [source]: error },
      }));
    },

    pushToast(kind: Toast["kind"], message: string) {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const newToast: Toast = {
        id,
        kind,
        message,
        expiresAt: Date.now() + 3000,
      };
      set((state) => ({
        toasts: [...state.toasts, newToast],
      }));
    },

    dismissToast(id: string) {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    },

    reset() {
      set({
        items: new Map(),
        itemsBySource: new Map(),
        scannerStatus: {
          apps: "idle",
          homebrew: "idle",
          mas: "idle",
          "npm-global": "idle",
          docker: "idle",
          xcode: "idle",
          "node-modules": "idle",
          "version-managers": "idle",
          caches: "idle",
        },
        scanErrors: {
          apps: undefined,
          homebrew: undefined,
          mas: undefined,
          "npm-global": undefined,
          docker: undefined,
          xcode: undefined,
          "node-modules": undefined,
          "version-managers": undefined,
          caches: undefined,
        },
        modal: null,
        selection: new Set(),
        toasts: [],
        cursor: null,
      });
    },
  }));
}
