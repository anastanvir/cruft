import { Box, Text } from "ink";
import { useMemo } from "react";
import { type StoreApi, useStore } from "zustand";
import type { CruftState } from "../state/store.ts";
import * as colors from "../theme/colors.ts";

interface Hint {
  key: string;
  label: string;
}

const ALL_HINTS: Hint[] = [
  { key: "↑↓", label: "navigate" },
  { key: "␣", label: "select" },
  { key: "Enter", label: "delete" },
  { key: "?", label: "help" },
  { key: "q", label: "quit" },
];

const MODAL_HINTS: Record<string, Hint[]> = {
  confirm: [
    { key: "Enter", label: "confirm" },
    { key: "Esc", label: "cancel" },
  ],
  filter: [
    { key: "u", label: "unused 90d" },
    { key: "l", label: "large 100MB" },
    { key: "1-9", label: "source" },
    { key: "Esc", label: "close" },
  ],
  sort: [
    { key: "t", label: "toggle order" },
    { key: "Esc", label: "close" },
  ],
  search: [{ key: "Esc", label: "close" }],
};

export function Footer({ store }: { store: StoreApi<CruftState> }) {
  const modal = useStore(store, (s) => s.modal);
  const selectionSize = useStore(store, (s) => s.selection.size);

  const hints = useMemo(() => {
    if (modal && MODAL_HINTS[modal]) {
      return MODAL_HINTS[modal];
    }
    if (selectionSize > 0) {
      return [
        { key: "Enter", label: `delete (${selectionSize})` as string },
        { key: "␣", label: "select" },
        { key: "A", label: "clear" },
        { key: "?", label: "help" },
      ];
    }
    return ALL_HINTS;
  }, [modal, selectionSize]);

  if (modal && !MODAL_HINTS[modal]) {
    return null;
  }

  return (
    <Box width="100%" backgroundColor={colors.bgElevated} paddingX={2} paddingY={1}>
      {hints.map((hint, i) => (
        <Box key={hint.key + hint.label}>
          {i > 0 && <Text color={colors.textDim}>{"  "}</Text>}
          <Text bold color={colors.accent}>
            {hint.key}
          </Text>
          <Text color={colors.textMuted}> {hint.label}</Text>
        </Box>
      ))}
    </Box>
  );
}
