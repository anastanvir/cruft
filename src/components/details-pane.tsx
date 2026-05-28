import { Box, Text } from "ink";
import { type StoreApi, useStore } from "zustand";
import { formatBytes, formatDateFull } from "../lib/format.ts";
import type { RiskLevel } from "../scanners/types.ts";
import { RISK_LABELS } from "../scanners/types.ts";
import type { CruftState } from "../state/store.ts";
import * as colors from "../theme/colors.ts";

const RISK_COLORS: Record<RiskLevel, string> = {
  safe: colors.riskSafe,
  low: colors.riskLow,
  medium: colors.riskMedium,
  high: colors.riskHigh,
};

export function DetailsPane({ store }: { store: StoreApi<CruftState> }) {
  const cursor = useStore(store, (s) => s.cursor);
  const items = useStore(store, (s) => s.items);
  const item = cursor ? items.get(cursor) : undefined;
  const focus = useStore(store, (s) => s.focus);
  const isFocused = focus === "details";

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={isFocused ? colors.borderFocus : colors.border}
      paddingX={1}
      width={40}
    >
      <Text bold color={colors.accent}>
        DETAILS
      </Text>
      {!item && (
        <Box marginTop={1}>
          <Text color={colors.textMuted}>No item selected</Text>
        </Box>
      )}
      {item && (
        <Box flexDirection="column" marginTop={1}>
          <Text bold color={colors.text}>
            {item.name}
          </Text>
          <Box marginTop={1} flexDirection="column">
            <DetailRow label="Size" value={formatBytes(item.sizeBytes)} />
            <DetailRow label="Path" value={item.path ?? "-"} />
            <DetailRow label="Last used" value={formatDateFull(item.lastUsed)} />
            <DetailRow label="Source" value={item.installSource ?? item.source} />
            <DetailRow label="Risk" value={RISK_LABELS[item.riskLevel]} valueColor={RISK_COLORS[item.riskLevel]} />
            {item.reason && <DetailRow label="Reason" value={item.reason} />}
            {item.dependents && item.dependents.length > 0 && (
              <DetailRow label="Dependents" value={item.dependents.join(", ")} />
            )}
          </Box>
          <Box marginTop={1}>
            <Text color={colors.textDim} italic>
              Remove strategy: {item.removeStrategy.kind}
            </Text>
          </Box>
        </Box>
      )}
    </Box>
  );
}

function DetailRow({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <Box>
      <Text color={colors.textMuted}>{label}:</Text>
      <Text color={valueColor ?? colors.text}> {value}</Text>
    </Box>
  );
}
