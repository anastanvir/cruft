import { Box, Text } from "ink";
import { useMemo } from "react";
import { type StoreApi, useStore } from "zustand";
import { formatBytes, formatDate } from "../lib/format.ts";
import type { Item, RiskLevel } from "../scanners/types.ts";
import { getVisibleItems } from "../state/selectors.ts";
import type { CruftState } from "../state/store.ts";
import * as colors from "../theme/colors.ts";
import * as icons from "../theme/icons.ts";

const VISIBLE_ROWS = 30;

const RISK_COLORS: Record<RiskLevel, string> = {
  safe: colors.riskSafe,
  low: colors.riskLow,
  medium: colors.riskMedium,
  high: colors.riskHigh,
};

export function ItemsPane({ store }: { store: StoreApi<CruftState> }) {
  const items = useStore(store, (s) => s.items);
  const itemsBySource = useStore(store, (s) => s.itemsBySource);
  const activeSource = useStore(store, (s) => s.activeSource);
  const filter = useStore(store, (s) => s.filter);
  const searchQuery = useStore(store, (s) => s.search);
  const sort = useStore(store, (s) => s.sort);
  const cursor = useStore(store, (s) => s.cursor);
  const selection = useStore(store, (s) => s.selection);
  const focus = useStore(store, (s) => s.focus);
  const isFocused = focus === "items";

  const allItems = useMemo(
    () => getVisibleItems({ items, itemsBySource, activeSource, filter, search: searchQuery, sort } as CruftState),
    [items, itemsBySource, activeSource, filter, searchQuery, sort],
  );

  const cursorIdx = cursor ? allItems.findIndex((i) => i.id === cursor) : 0;
  const clampedIdx = Math.max(0, cursorIdx);
  const scrollOffset = Math.max(0, clampedIdx - Math.floor(VISIBLE_ROWS / 2));
  const visible = allItems.slice(scrollOffset, scrollOffset + VISIBLE_ROWS);

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={isFocused ? colors.borderFocus : colors.border}
      paddingX={1}
      flexGrow={1}
    >
      <Box>
        <Text bold color={colors.accent}>
          ITEMS
        </Text>
        <Text color={colors.textDim}>
          {" "}
          {sort.key === "size" ? icons.sortDesc : icons.sortAsc} {sort.key} {sort.dir}
        </Text>
        <Text color={colors.textMuted}> ({allItems.length} total)</Text>
      </Box>
      <Box flexDirection="column" marginTop={1}>
        {visible.map((item) => (
          <ItemRow key={item.id} item={item} isSelected={selection.has(item.id)} isCursor={item.id === cursor} />
        ))}
      </Box>
    </Box>
  );
}

function ItemRow({
  item,
  isSelected,
  isCursor,
}: {
  item: Item;
  isSelected: boolean;
  isCursor: boolean;
}) {
  const selectIcon = isSelected ? icons.selected : icons.unselected;
  const cursorIcon = isCursor ? icons.focused : " ";
  const sizeColor = getSizeColor(item.sizeBytes);
  const riskColor = RISK_COLORS[item.riskLevel];

  return (
    <Box>
      <Text color={isCursor ? colors.accent : colors.textDim}>{cursorIcon}</Text>
      <Text color={isSelected ? colors.success : colors.textMuted}>{selectIcon}</Text>
      <Text color={riskColor}>{icons.riskIndicator}</Text>
      <Text color={isCursor ? colors.text : isSelected ? colors.success : colors.text} bold={isCursor}>
        {" "}
        {item.name}
      </Text>
      <Text color={sizeColor}> {formatBytes(item.sizeBytes)}</Text>
      <Text color={colors.textDim}> {item.lastUsed ? formatDate(item.lastUsed) : "-"}</Text>
      {item.reason && (
        <Text color={colors.warning}>
          {" "}
          {icons.warning} {item.reason}
        </Text>
      )}
    </Box>
  );
}

function getSizeColor(bytes: number): string {
  if (bytes > 5_000_000_000) {
    return colors.sizeXL;
  }
  if (bytes > 1_000_000_000) {
    return colors.sizeL;
  }
  if (bytes > 100_000_000) {
    return colors.sizeM;
  }
  return colors.sizeS;
}
