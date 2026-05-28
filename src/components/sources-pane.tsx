import { Box, Text } from "ink";
import { useMemo } from "react";
import { type StoreApi, useStore } from "zustand";
import { formatBytes } from "../lib/format.ts";
import { ALL_SOURCES, SOURCE_LABELS } from "../scanners/types.ts";
import type { CruftState } from "../state/store.ts";
import * as colors from "../theme/colors.ts";
import * as icons from "../theme/icons.ts";

export function SourcesPane({ store }: { store: StoreApi<CruftState> }) {
  const itemsBySource = useStore(store, (s) => s.itemsBySource);
  const items = useStore(store, (s) => s.items);
  const activeSource = useStore(store, (s) => s.activeSource);
  const focus = useStore(store, (s) => s.focus);
  const scannerStatus = useStore(store, (s) => s.scannerStatus);
  const isFocused = focus === "sources";

  const counts = useMemo(() => {
    const result: Record<string, { count: number; sizeBytes: number }> = {};
    for (const source of ALL_SOURCES) {
      const ids = itemsBySource.get(source) ?? [];
      let sizeBytes = 0;
      for (const id of ids) {
        const item = items.get(id);
        if (item) {
          sizeBytes += item.sizeBytes;
        }
      }
      result[source] = { count: ids.length, sizeBytes };
    }
    return result;
  }, [itemsBySource, items]);

  const totalCount = ALL_SOURCES.reduce((s, src) => s + (counts[src]?.count ?? 0), 0);
  const totalSize = ALL_SOURCES.reduce((s, src) => s + (counts[src]?.sizeBytes ?? 0), 0);

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={isFocused ? colors.borderFocus : colors.border}
      paddingX={1}
      width={30}
    >
      <Text bold color={colors.accent}>
        SOURCES
      </Text>
      <Box flexDirection="column" marginTop={1}>
        <SourceRow
          name="All"
          icon={icons.folderExpanded}
          count={totalCount}
          sizeBytes={totalSize}
          isActive={activeSource === "all"}
        />
        {ALL_SOURCES.map((source) => {
          const c = counts[source];
          const status = scannerStatus[source];
          return (
            <SourceRow
              key={source}
              name={SOURCE_LABELS[source]}
              icon={status === "running" ? "⠋" : icons.folderCollapsed}
              count={c?.count ?? 0}
              sizeBytes={c?.sizeBytes ?? 0}
              isActive={activeSource === source}
              status={status}
            />
          );
        })}
      </Box>
    </Box>
  );
}

function SourceRow({
  name,
  icon,
  count,
  sizeBytes,
  isActive,
  status,
}: {
  name: string;
  icon: string;
  count: number;
  sizeBytes: number;
  isActive: boolean;
  status?: string;
}) {
  return (
    <Box>
      <Text color={isActive ? colors.accent : colors.textDim}>{icon}</Text>
      <Text color={isActive ? colors.text : colors.textMuted}> {name} </Text>
      <Text color={colors.textDim}>{count}</Text>
      {count > 0 && <Text color={colors.textDim}> {formatBytes(sizeBytes)}</Text>}
      {status === "running" && <Text color={colors.info}> (scanning…)</Text>}
    </Box>
  );
}
