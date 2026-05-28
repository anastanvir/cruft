import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import { type StoreApi, useStore } from "zustand";
import type { CruftState, Toast as ToastType } from "../state/store.ts";
import * as colors from "../theme/colors.ts";

const KIND_COLORS: Record<ToastType["kind"], string> = {
  info: colors.info,
  success: colors.success,
  warning: colors.warning,
  error: colors.danger,
};

export function Toasts({ store }: { store: StoreApi<CruftState> }) {
  const toasts = useStore(store, (s) => s.toasts);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <Box position="absolute" top={0} width="100%" flexDirection="column">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} store={store} />
      ))}
    </Box>
  );
}

function ToastItem({ toast, store }: { toast: ToastType; store: StoreApi<CruftState> }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const remaining = toast.expiresAt - Date.now();
    if (remaining <= 0) {
      setVisible(false);
      return;
    }
    const timer = setTimeout(() => {
      setVisible(false);
      store.getState().dismissToast(toast.id);
    }, remaining);
    return () => clearTimeout(timer);
  }, [toast.expiresAt, toast.id, store]);

  if (!visible) {
    return null;
  }

  return (
    <Box paddingX={2} paddingY={1} backgroundColor={colors.bgElevated}>
      <Text color={KIND_COLORS[toast.kind]} bold>
        {toast.kind.toUpperCase()}
      </Text>
      <Text color={colors.text}> {toast.message}</Text>
    </Box>
  );
}
