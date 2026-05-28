import { useMemo } from "react";
import { type StoreApi, useStore } from "zustand";
import { formatBytes } from "../lib/format.ts";
import type { RiskLevel } from "../scanners/types.ts";
import { RISK_LABELS } from "../scanners/types.ts";
import type { CruftState } from "../state/store.ts";
import * as colors from "../theme/colors.ts";
import * as icons from "../theme/icons.ts";
import { Dialog, DialogRow, FillRow } from "./dialog.tsx";

const RISK_COLORS: Record<RiskLevel, string> = {
  safe: colors.riskSafe,
  low: colors.riskLow,
  medium: colors.riskMedium,
  high: colors.riskHigh,
};

const RISK_LEVELS: RiskLevel[] = ["safe", "low", "medium", "high"];

export function ConfirmModal({ store }: { store: StoreApi<CruftState> }) {
  const selection = useStore(store, (s) => s.selection);
  const items = useStore(store, (s) => s.items);

  const totals = useMemo(() => {
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

  const riskBreakdown = useMemo(() => {
    const breakdown: Record<string, { count: number; sizeBytes: number }> = {};
    for (const id of selection) {
      const item = items.get(id);
      if (!item) continue;
      const level = item.riskLevel;
      if (!breakdown[level]) {
        breakdown[level] = { count: 0, sizeBytes: 0 };
      }
      breakdown[level].count++;
      breakdown[level].sizeBytes += item.sizeBytes;
    }
    return breakdown as Record<RiskLevel, { count: number; sizeBytes: number }>;
  }, [selection, items]);

  return (
    <Dialog borderColor={colors.danger}>
      <DialogRow bold color={colors.danger}>
        {`Move ${totals.count} items (${formatBytes(totals.sizeBytes)}) to Trash?`}
      </DialogRow>
      <FillRow />
      {RISK_LEVELS.map((level) => {
        const b = riskBreakdown[level];
        if (!b || b.count === 0) return null;
        return (
          <DialogRow key={level} color={RISK_COLORS[level]}>
            {`${icons.riskIndicator} ${RISK_LABELS[level]}: ${b.count} items (${formatBytes(b.sizeBytes)})`}
          </DialogRow>
        );
      })}
      <FillRow />
      <DialogRow color={colors.textMuted}>
        Items will be recoverable for 30 days.
      </DialogRow>
      <DialogRow color={colors.textMuted}>
        Enter to confirm  •  Esc to cancel
      </DialogRow>
    </Dialog>
  );
}
