import type { Item, RemoveStrategy } from "../scanners/types.ts";
import { filterBlocked } from "./blocklist.ts";

export interface RemovalStep {
  itemId: string;
  strategy: RemoveStrategy;
}

export interface RemovalPlan {
  steps: RemovalStep[];
  totalSizeBytes: number;
  itemCount: number;
  blockedItems: Array<{ id: string; name: string; reason: string }>;
  riskBreakdown: Record<string, { count: number; sizeBytes: number }>;
}

export function buildRemovalPlan(items: Item[]): RemovalPlan {
  const steps: RemovalStep[] = [];
  const blockedItems: Array<{ id: string; name: string; reason: string }> = [];
  const riskBreakdown: Record<string, { count: number; sizeBytes: number }> = {};
  let totalSizeBytes = 0;

  for (const item of items) {
    const level = item.riskLevel;
    if (!riskBreakdown[level]) {
      riskBreakdown[level] = { count: 0, sizeBytes: 0 };
    }
    riskBreakdown[level].count++;
    riskBreakdown[level].sizeBytes += item.sizeBytes;

    if (item.riskLevel === "high") {
      blockedItems.push({
        id: item.id,
        name: item.name,
        reason: item.reason ?? "Marked as unsafe to remove",
      });
      continue;
    }

    const filtered = filterStrategy(item.removeStrategy);
    if (!filtered) {
      blockedItems.push({
        id: item.id,
        name: item.name,
        reason: "Path resolved to a protected system location",
      });
      continue;
    }

    steps.push({ itemId: item.id, strategy: filtered });
    totalSizeBytes += item.sizeBytes;
  }

  return {
    steps,
    totalSizeBytes,
    itemCount: steps.length,
    blockedItems,
    riskBreakdown,
  };
}

function filterStrategy(strategy: RemoveStrategy): RemoveStrategy | null {
  switch (strategy.kind) {
    case "trash": {
      const allowed = filterBlocked(strategy.paths);
      if (allowed.length === 0) {
        return null;
      }
      return { kind: "trash", paths: allowed };
    }
    case "exec":
      return strategy;
    case "composite": {
      const filteredSteps = strategy.steps.map(filterStrategy).filter((s): s is RemoveStrategy => s !== null);
      if (filteredSteps.length === 0) {
        return null;
      }
      return { kind: "composite", steps: filteredSteps };
    }
  }
}
