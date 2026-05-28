import { Box } from "ink";
import { useCallback, useEffect, useRef } from "react";
import { type StoreApi, useStore } from "zustand";
import { ConfirmModal } from "./components/confirm-modal.tsx";
import { DetailsPane } from "./components/details-pane.tsx";
import { FilterModal } from "./components/filter-modal.tsx";
import { Footer } from "./components/footer.tsx";
import { Header } from "./components/header.tsx";
import { HelpOverlay } from "./components/help-overlay.tsx";
import { ItemsPane } from "./components/items-pane.tsx";
import { SearchInput } from "./components/search-input.tsx";
import { SortMenu } from "./components/sort-menu.tsx";
import { SourcesPane } from "./components/sources-pane.tsx";
import { Splash } from "./components/splash.tsx";
import { Toasts } from "./components/toast.tsx";
import { executeRemoval } from "./remover/execute.ts";
import { type HistoryEntry, writeHistory } from "./remover/history.ts";
import { buildRemovalPlan } from "./remover/plan.ts";
import { appsScanner } from "./scanners/apps.ts";
import { cachesScanner } from "./scanners/caches.ts";
import { dockerScanner } from "./scanners/docker.ts";
import { homebrewScanner } from "./scanners/homebrew.ts";
import { masScanner } from "./scanners/mas.ts";
import { nodeModulesScanner } from "./scanners/node-modules.ts";
import { npmGlobalScanner } from "./scanners/npm-global.ts";
import { ScannerRegistry } from "./scanners/registry.ts";
import { ALL_SOURCES } from "./scanners/types.ts";
import { versionManagersScanner } from "./scanners/version-managers.ts";
import { xcodeScanner } from "./scanners/xcode.ts";
import { focusNext, focusPrev } from "./state/focus.ts";
import { getSafeItemIds, getVisibleItems } from "./state/selectors.ts";
import type { CruftState } from "./state/store.ts";
import * as colors from "./theme/colors.ts";

export function App({ store }: { store: StoreApi<CruftState> }) {
  const modal = useStore(store, (s) => s.modal);

  const items = useStore(store, (s) => s.items);
  const selection = useStore(store, (s) => s.selection);
  const abortRef = useRef<AbortController | null>(null);

  const runScanners = useCallback(async () => {
    const controller = new AbortController();
    abortRef.current = controller;

    const registry = new ScannerRegistry();
    registry.register(appsScanner);
    registry.register(homebrewScanner);
    registry.register(masScanner);
    registry.register(npmGlobalScanner);
    registry.register(dockerScanner);
    registry.register(xcodeScanner);
    registry.register(nodeModulesScanner);
    registry.register(versionManagersScanner);
    registry.register(cachesScanner);

    const allScanners = registry.getAll();
    for (const scanner of allScanners) {
      store.getState().setScannerStatus(scanner.id, "running");
    }

    const available = await registry.getAvailable();
    for (const s of allScanners) {
      if (!available.find((a) => a.id === s.id)) {
        store.getState().setScannerStatus(s.id, "unavailable");
      }
    }

    let batch: import("./scanners/types.ts").Item[] = [];
    await registry.runAll((item) => {
      batch.push(item);
      if (batch.length >= 25) {
        store.getState().addItems(batch);
        batch = [];
      }
    }, controller.signal);
    if (batch.length > 0) {
      store.getState().addItems(batch);
    }

    for (const scanner of allScanners) {
      store.getState().setScannerStatus(scanner.id, "done");
    }

    store.getState().pushToast("success", "Scan complete");
  }, [store]);

  const handleDelete = useCallback(async () => {
    const selected = [...selection]
      .map((id) => store.getState().items.get(id))
      .filter((x): x is NonNullable<typeof x> => x !== undefined);
    const plan = buildRemovalPlan(selected);

    if (plan.steps.length === 0) {
      store.getState().pushToast("warning", "No removable items selected");
      store.getState().setModal(null);
      return;
    }

    const results = await executeRemoval(plan.steps);
    const historyEntries: HistoryEntry[] = results.map((r) => {
      const item = store.getState().items.get(r.itemId);
      return {
        itemId: r.itemId,
        name: item?.name ?? "unknown",
        source: item?.source ?? "unknown",
        sizeBytes: item?.sizeBytes ?? 0,
        status: r.success ? "removed" : "failed",
        error: r.error,
        timestamp: new Date().toISOString(),
      };
    });

    writeHistory(historyEntries);
    store.getState().clearSelection();
    store.getState().setModal(null);

    store
      .getState()
      .pushToast("success", `Freed ${(plan.totalSizeBytes / 1_000_000_000).toFixed(1)} GB. Press u to undo.`);
    if (results.some((r) => !r.success)) {
      store.getState().pushToast("error", `${results.filter((r) => !r.success).length} items failed`);
    }
  }, [store, selection]);

  const handleKey = useCallback(
    (key: string) => {
      const state = store.getState();

      if (state.modal) {
        handleModalKey(key, state, store, handleDelete);
        return;
      }

      switch (key) {
        case "up": {
          const visible = getVisibleItems(state);
          const idx = state.cursor ? visible.findIndex((i) => i.id === state.cursor) : -1;
          const newIdx = Math.max(0, idx === -1 ? 0 : idx - 1);
          store.getState().setCursor(visible[newIdx]?.id ?? null);
          break;
        }
        case "down": {
          const visible = getVisibleItems(state);
          const idx = state.cursor ? visible.findIndex((i) => i.id === state.cursor) : -1;
          const newIdx = Math.min(visible.length - 1, idx === -1 ? 0 : idx + 1);
          store.getState().setCursor(visible[newIdx]?.id ?? null);
          break;
        }
        case "left":
          store.getState().setFocus(focusPrev(state.focus));
          break;
        case "right":
          store.getState().setFocus(focusNext(state.focus));
          break;
        case "pageup": {
          const visible = getVisibleItems(state);
          const idx = state.cursor ? visible.findIndex((i) => i.id === state.cursor) : 0;
          const newIdx = Math.max(0, idx - 30);
          store.getState().setCursor(visible[newIdx]?.id ?? null);
          break;
        }
        case "pagedown": {
          const visible = getVisibleItems(state);
          const idx = state.cursor ? visible.findIndex((i) => i.id === state.cursor) : 0;
          const newIdx = Math.min(visible.length - 1, idx + 30);
          store.getState().setCursor(visible[newIdx]?.id ?? null);
          break;
        }
        case "home": {
          const visible = getVisibleItems(state);
          store.getState().setCursor(visible[0]?.id ?? null);
          break;
        }
        case "end": {
          const visible = getVisibleItems(state);
          store.getState().setCursor(visible[visible.length - 1]?.id ?? null);
          break;
        }
        case " ":
          if (state.cursor) {
            store.getState().toggleSelect(state.cursor);
          }
          break;
        case "enter":
          if (state.selection.size > 0) {
            store.getState().setModal("confirm");
          }
          break;
        case "a":
          store.getState().selectVisible(getVisibleItems(state).map((i) => i.id));
          break;
        case "A":
          store.getState().clearSelection();
          break;
        case "i":
          store.getState().invertSelection(getVisibleItems(state).map((i) => i.id));
          break;
        case "S":
          store.getState().selectVisible(getSafeItemIds(state));
          store.getState().pushToast("info", "Selected all safe items");
          break;
        case "d":
          if (state.selection.size > 0) {
            store.getState().setModal("confirm");
          } else {
            store.getState().pushToast("warning", "No items selected");
          }
          break;
        case "s":
          store.getState().setModal("sort");
          break;
        case "f":
          store.getState().setModal("filter");
          break;
        case "!":
          {
            const currentMax = state.filter.maxRisk;
            const newVal = currentMax === "safe" ? undefined : "safe";
            store.getState().setFilter({ maxRisk: newVal as "safe" | undefined });
            store
              .getState()
              .pushToast(newVal ? "info" : "warning", newVal ? "Showing safe items only" : "Showing all risk levels");
          }
          break;
        case "/":
          store.getState().setModal("search");
          break;
        case "r":
          store.getState().reset();
          if (abortRef.current) {
            abortRef.current.abort();
          }
          runScanners();
          break;
        case "c":
          store.getState().setDensity(state.density === "compact" ? "comfortable" : "compact");
          break;
        case "?":
          store.getState().setModal("help");
          break;
        case "q":
          process.exit(0);
          break;
      }
    },
    [store, handleDelete, runScanners],
  );

  function handleModalKey(key: string, state: CruftState, st: StoreApi<CruftState>, onDelete: () => void) {
    if (state.modal === "confirm") {
      if (key === "y" || key === "enter") {
        onDelete();
      } else if (key === "escape") {
        st.getState().setModal(null);
      }
      return;
    }
    if (key === "escape" || key === "enter") {
      if (state.modal === "search") {
        st.getState().setSearch("");
      }
      st.getState().setModal(null);
      return;
    }
    if (state.modal === "filter") {
      if (key === "u") {
        st.getState().setFilter({ staleDays: 90 });
      } else if (key === "l") {
        st.getState().setFilter({ minSize: 100_000_000 });
      } else if (key >= "1" && key <= "9") {
        const idx = Number.parseInt(key, 10) - 1;
        const source = ALL_SOURCES[idx];
        if (source) {
          const current = st.getState().filter.sources ?? [];
          const next = current.includes(source) ? current.filter((s) => s !== source) : [...current, source];
          st.getState().setFilter({ sources: next.length > 0 ? next : undefined });
        }
      }
      return;
    }
    if (state.modal === "sort") {
      if (key === "t") {
        const newDir = state.sort.dir === "asc" ? "desc" : "asc";
        st.getState().setSort({ dir: newDir });
      }
      return;
    }
  }

  useEffect(() => {
    let buffer = "";
    const handleInput = (data: Buffer) => {
      buffer += data.toString();
      while (buffer.length > 0) {
        if (buffer.startsWith("\u001b[A")) {
          handleKey("up");
          buffer = buffer.slice(3);
        } else if (buffer.startsWith("\u001b[B")) {
          handleKey("down");
          buffer = buffer.slice(3);
        } else if (buffer.startsWith("\u001b[D")) {
          handleKey("left");
          buffer = buffer.slice(3);
        } else if (buffer.startsWith("\u001b[C")) {
          handleKey("right");
          buffer = buffer.slice(3);
        } else if (buffer.startsWith("\u001b[5~")) {
          handleKey("pageup");
          buffer = buffer.slice(4);
        } else if (buffer.startsWith("\u001b[6~")) {
          handleKey("pagedown");
          buffer = buffer.slice(4);
        } else if (buffer.startsWith("\u001b[H")) {
          handleKey("home");
          buffer = buffer.slice(3);
        } else if (buffer.startsWith("\u001b[F")) {
          handleKey("end");
          buffer = buffer.slice(3);
        } else if (buffer.startsWith("\u001b")) {
          handleKey("escape");
          buffer = buffer.slice(1);
        } else if (buffer.startsWith("\u0003")) {
          process.exit(0);
          buffer = buffer.slice(1);
        } else {
          const ch = buffer[0];
          buffer = buffer.slice(1);
          if (ch === "\r" || ch === "\n") {
            handleKey("enter");
            continue;
          }
          handleKey(ch);
        }
      }
    };

    process.stdin.on("data", handleInput);
    return () => {
      process.stdin.removeListener("data", handleInput);
    };
  }, [handleKey]);

  useEffect(() => {
    runScanners();
  }, [runScanners]);

  if (items.size === 0) {
    return <Splash store={store} />;
  }

  return (
    <Box flexDirection="column" width="100%" height="100%" backgroundColor={colors.bg}>
      <Header store={store} />
      <Box flexGrow={1}>
        <SourcesPane store={store} />
        <ItemsPane store={store} />
        <DetailsPane store={store} />
      </Box>
      <Footer store={store} />
      <Toasts store={store} />
      {modal && (
        <Box
          position="absolute"
          marginLeft={0}
          marginTop={0}
          width="100%"
          height="100%"
          justifyContent="center"
          alignItems="center"
        >
          {modal === "confirm" && <ConfirmModal store={store} />}
          {modal === "filter" && <FilterModal store={store} />}
          {modal === "sort" && <SortMenu store={store} />}
          {modal === "search" && <SearchInput store={store} />}
          {modal === "help" && <HelpOverlay />}
        </Box>
      )}
    </Box>
  );
}
