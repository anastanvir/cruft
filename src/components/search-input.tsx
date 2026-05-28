import { Box, Text } from "ink";
import TextInput from "ink-text-input";
import { type StoreApi, useStore } from "zustand";
import type { CruftState } from "../state/store.ts";
import * as colors from "../theme/colors.ts";

export function SearchInput({ store }: { store: StoreApi<CruftState> }) {
  const search = useStore(store, (s) => s.search);

  return (
    <Box width="100%" height="100%" justifyContent="center" alignItems="center">
      <Box backgroundColor="#2E2E2E" borderStyle="round" borderColor={colors.borderFocus} paddingX={4} paddingY={2}>
        <Text color={colors.textMuted}>Search: </Text>
        <TextInput
          value={search}
          onChange={(val: string) => store.getState().setSearch(val)}
          placeholder="Type to search…"
        />
      </Box>
    </Box>
  );
}
