import { Box, Text } from "ink";
import { type StoreApi, useStore } from "zustand";
import type { CruftState } from "../state/store.ts";
import * as colors from "../theme/colors.ts";

export function SortMenu({ store }: { store: StoreApi<CruftState> }) {
  const sort = useStore(store, (s) => s.sort);

  return (
    <Box
      flexDirection="column"
      backgroundColor="#2E2E2E"
      borderStyle="round"
      borderColor={colors.borderFocus}
      paddingX={4}
      paddingY={2}
    >
      <Text bold color={colors.accent}>
        Sort by
      </Text>
      <Box flexDirection="column" marginTop={1}>
        <SortOption label="Size" value="size" current={sort.key} />
        <SortOption label="Name" value="name" current={sort.key} />
        <SortOption label="Last used" value="lastUsed" current={sort.key} />
      </Box>
      <Box marginTop={1}>
        <Text color={colors.textMuted}>
          <Text bold color={colors.text}>
            t
          </Text>{" "}
          toggle asc/desc
          {"  "}
          <Text bold color={colors.text}>
            Esc
          </Text>{" "}
          close
        </Text>
      </Box>
    </Box>
  );
}

function SortOption({
  label,
  value,
  current,
}: {
  label: string;
  value: string;
  current: string;
}) {
  return (
    <Box>
      <Text color={value === current ? colors.accent : colors.textMuted}>
        {value === current ? "●" : "○"} {label}
      </Text>
    </Box>
  );
}
