import { type StoreApi, useStore } from "zustand";
import { ALL_SOURCES, SOURCE_LABELS } from "../scanners/types.ts";
import type { CruftState } from "../state/store.ts";
import * as colors from "../theme/colors.ts";
import { Dialog, DialogRow, FillRow } from "./dialog.tsx";

export function FilterModal({ store }: { store: StoreApi<CruftState> }) {
  const filter = useStore(store, (s) => s.filter);
  const activeSource = useStore(store, (s) => s.activeSource);

  const activeRows: string[] = [];
  if (filter.minSize !== undefined) activeRows.push(`Min size: ${filter.minSize} bytes`);
  if (filter.staleDays !== undefined) activeRows.push(`Unused: ${filter.staleDays}+ days`);
  if (filter.maxRisk !== undefined) activeRows.push(`Max risk: ${filter.maxRisk}`);
  if (filter.sources && filter.sources.length > 0) {
    activeRows.push(`Sources: ${filter.sources.map((s) => SOURCE_LABELS[s]).join(", ")}`);
  }

  const sourceTokens = ALL_SOURCES.map((source) => {
    const isActive = filter.sources
      ? filter.sources.includes(source)
      : activeSource === "all" || activeSource === source;
    return `${isActive ? "●" : "○"} ${SOURCE_LABELS[source]}`;
  });
  const sourceRows: string[] = [];
  const ROW_BUDGET = 56;
  let current = "";
  for (const tok of sourceTokens) {
    const candidate = current ? `${current}  ${tok}` : tok;
    if (candidate.length > ROW_BUDGET) {
      if (current) sourceRows.push(current);
      current = tok;
    } else {
      current = candidate;
    }
  }
  if (current) sourceRows.push(current);

  return (
    <Dialog borderColor={colors.borderFocus}>
      <DialogRow bold color={colors.accent}>
        Filter
      </DialogRow>
      <FillRow />
      <DialogRow color={colors.textMuted}>Active filters:</DialogRow>
      {activeRows.length === 0 ? (
        <DialogRow color={colors.textDim}>  None (showing all)</DialogRow>
      ) : (
        activeRows.map((row, i) => (
          <DialogRow key={i} color={colors.text}>
            {`  ${row}`}
          </DialogRow>
        ))
      )}
      <FillRow />
      <DialogRow color={colors.textMuted}>{`Sources (current: ${activeSource}):`}</DialogRow>
      {sourceRows.map((row, i) => (
        <DialogRow key={i} color={colors.text}>
          {row}
        </DialogRow>
      ))}
      <FillRow />
      <DialogRow color={colors.textMuted}>{"u unused 90d+  •  l large >100MB"}</DialogRow>
      <DialogRow color={colors.textMuted}>{"1-9 toggle source  •  Esc close"}</DialogRow>
    </Dialog>
  );
}
