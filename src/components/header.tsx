import { Box, Text } from "ink";
import { useMemo } from "react";
import { type StoreApi, useStore } from "zustand";
import { formatBytes } from "../lib/format.ts";
import type { RiskLevel } from "../scanners/types.ts";
import type { CruftState } from "../state/store.ts";
import * as colors from "../theme/colors.ts";
import * as icons from "../theme/icons.ts";

const RISK_COLORS: Record<RiskLevel, string> = {
  safe: colors.riskSafe,
  low: colors.riskLow,
  medium: colors.riskMedium,
  high: colors.riskHigh,
};

export function Header({ store }: { store: StoreApi<CruftState> }) {
  const items = useStore(store, (s) => s.items);
  const selection = useStore(store, (s) => s.selection);
  const scannerStatus = useStore(store, (s) => s.scannerStatus);

  const itemCount = items.size;
  const totalSize = useMemo(() => [...items.values()].reduce((sum, i) => sum + i.sizeBytes, 0), [items]);

  const selTotal = useMemo(() => {
    let count = 0;
    let sizeBytes = 0;
    for (const id of selection) {
      const item = items.get(id);
      if (item) {
        count++;
        sizeBytes += item.sizeBytes;
      }
    }
    return { count, sizeBytes };
  }, [selection, items]);

  const riskTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const item of items.values()) {
      totals[item.riskLevel] = (totals[item.riskLevel] ?? 0) + item.sizeBytes;
    }
    return totals as Record<RiskLevel, number | undefined>;
  }, [items]);

  const runningCount = Object.values(scannerStatus).filter((s) => s === "running").length;
  const isScanning = runningCount > 0;

  return (
    <Box width="100%" backgroundColor={colors.bgElevated} paddingX={2} paddingY={1}>
      <Text bold color={colors.accent}>
        cruft v0.1.0
      </Text>
      <Text color={colors.textMuted}> • </Text>
      {isScanning ? (
        <Text color={colors.info}>Scanning: {runningCount} scanners active...</Text>
      ) : (
        <Text color={colors.text}>
          Cruft:{" "}
          <Text bold color={colors.warning}>
            {formatBytes(totalSize)}
          </Text>{" "}
          ({itemCount} items)
        </Text>
      )}
      <Text color={colors.textMuted}> • </Text>
      {(["safe", "low", "medium", "high"] as RiskLevel[]).map((level) => {
        const size = riskTotals[level];
        if (!size) return null;
        return (
          <Box key={level}>
            <Text color={RISK_COLORS[level]}>
              {icons.riskIndicator} {formatBytes(size)}
            </Text>
            <Text color={colors.textMuted}> </Text>
          </Box>
        );
      })}
      <Text color={colors.textMuted}> • </Text>
      <Text color={colors.text}>
        Selected:{" "}
        <Text bold color={selTotal.count > 0 ? colors.success : colors.textMuted}>
          {formatBytes(selTotal.sizeBytes)}
        </Text>{" "}
        ({selTotal.count} items)
      </Text>
    </Box>
  );
}
