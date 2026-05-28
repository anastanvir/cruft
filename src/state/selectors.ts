import { buildIndex, search } from "../lib/fuzzy.ts";
import type { Item, RiskLevel, Source } from "../scanners/types.ts";
import { RISK_ORDER } from "../scanners/types.ts";
import type { CruftState } from "./store.ts";

export function getVisibleItems(state: CruftState): Item[] {
  const { items, activeSource, filter, search: searchQuery } = state;
  let result: Item[] = [];

  if (activeSource === "all") {
    result = [...items.values()];
  } else {
    const sourceIds = state.itemsBySource.get(activeSource) ?? [];
    result = sourceIds.map((id) => items.get(id)).filter((x): x is Item => x !== undefined);
  }

  if (filter.minSize !== undefined) {
    result = result.filter((item) => item.sizeBytes >= (filter.minSize ?? 0));
  }

  if (filter.staleDays !== undefined) {
    const cutoff = Date.now() - filter.staleDays * 24 * 60 * 60 * 1000;
    result = result.filter((item) => {
      if (!item.lastUsed) {
        return true;
      }
      return item.lastUsed.getTime() < cutoff;
    });
  }

  if (filter.sources !== undefined && filter.sources.length > 0) {
    const sourceSet = new Set(filter.sources);
    result = result.filter((item) => sourceSet.has(item.source));
  }

  if (filter.maxRisk !== undefined) {
    const maxOrder = RISK_ORDER[filter.maxRisk];
    result = result.filter((item) => RISK_ORDER[item.riskLevel] <= maxOrder);
  }

  if (searchQuery) {
    const fuzzyItems = result.map((item) => ({
      id: item.id,
      name: item.name,
      source: item.source,
    }));
    buildIndex(fuzzyItems);
    const matchingIds = new Set(search(searchQuery));
    result = result.filter((item) => matchingIds.has(item.id));
  }

  result.sort((a, b) => {
    const { key, dir } = state.sort;
    let cmp = 0;
    switch (key) {
      case "size":
        cmp = a.sizeBytes - b.sizeBytes;
        break;
      case "name":
        cmp = a.name.localeCompare(b.name);
        break;
      case "lastUsed": {
        const aTime = a.lastUsed?.getTime() ?? 0;
        const bTime = b.lastUsed?.getTime() ?? 0;
        cmp = aTime - bTime;
        break;
      }
    }
    return dir === "desc" ? -cmp : cmp;
  });

  return result;
}

export function getSelectionTotals(state: CruftState): { count: number; sizeBytes: number } {
  let count = 0;
  let sizeBytes = 0;

  for (const id of state.selection) {
    const item = state.items.get(id);
    if (item) {
      count++;
      sizeBytes += item.sizeBytes;
    }
  }

  return { count, sizeBytes };
}

export function getSourceCounts(state: CruftState): Record<Source, { count: number; sizeBytes: number }> {
  const sources = Object.keys(state.scannerStatus) as Source[];
  const counts: Record<string, { count: number; sizeBytes: number }> = {};

  for (const source of sources) {
    const ids = state.itemsBySource.get(source) ?? [];
    let sizeBytes = 0;
    for (const id of ids) {
      const item = state.items.get(id);
      if (item) {
        sizeBytes += item.sizeBytes;
      }
    }
    counts[source] = { count: ids.length, sizeBytes };
  }

  return counts as Record<Source, { count: number; sizeBytes: number }>;
}

export function getHighlightedItem(state: CruftState): Item | undefined {
  if (!state.cursor) {
    return undefined;
  }
  return state.items.get(state.cursor);
}

export function getRiskBreakdown(
  state: CruftState,
  ids: Set<string>,
): Record<RiskLevel, { count: number; sizeBytes: number }> {
  const breakdown: Record<string, { count: number; sizeBytes: number }> = {};
  for (const id of ids) {
    const item = state.items.get(id);
    if (!item) continue;
    const level = item.riskLevel;
    if (!breakdown[level]) {
      breakdown[level] = { count: 0, sizeBytes: 0 };
    }
    breakdown[level].count++;
    breakdown[level].sizeBytes += item.sizeBytes;
  }
  return breakdown as Record<RiskLevel, { count: number; sizeBytes: number }>;
}

export function getSafeItemIds(state: CruftState): string[] {
  const ids: string[] = [];
  for (const [id, item] of state.items) {
    if (item.riskLevel === "safe" || item.riskLevel === "low") {
      ids.push(id);
    }
  }
  return ids;
}
