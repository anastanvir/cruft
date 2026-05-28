import { Box, Text } from "ink";
import { useEffect, useState } from "react";
import { type StoreApi, useStore } from "zustand";
import type { CruftState } from "../state/store.ts";
import * as colors from "../theme/colors.ts";
import * as icons from "../theme/icons.ts";

const SOURCE_LABELS: Record<string, string> = {
  apps: "Applications",
  homebrew: "Homebrew",
  mas: "Mac App Store",
  "npm-global": "npm Globals",
  docker: "Docker",
  xcode: "Xcode",
  "node-modules": "node_modules",
  "version-managers": "Version Managers",
  caches: "System Caches",
};

function AnimatedSpinner() {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setFrame((f) => (f + 1) % icons.spinnerFrames.length), 80);
    return () => clearInterval(interval);
  }, []);
  return <Text color={colors.accent}>{icons.spinnerFrames[frame]}</Text>;
}

function ProgressBar() {
  const barW = 30;
  const frames = Array.from({ length: barW }, (_, i) => {
    const left = "\u2588".repeat(i);
    const mid = "\u2593".repeat(Math.min(3, barW - i));
    const right = "\u2591".repeat(Math.max(0, barW - i - 3));
    return left + mid + right;
  });
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setFrame((f) => (f + 1) % 30), 100);
    return () => clearInterval(interval);
  }, []);
  return (
    <Box>
      <Text color={colors.accent}>[</Text>
      <Text color={colors.success}>{frames[frame]}</Text>
      <Text color={colors.accent}>]</Text>
    </Box>
  );
}

export function Splash({ store }: { store: StoreApi<CruftState> }) {
  const scannerStatus = useStore(store, (s) => s.scannerStatus);
  const items = useStore(store, (s) => s.items);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  const running = Object.entries(scannerStatus).filter(([_, s]) => s === "running");
  const done = Object.entries(scannerStatus).filter(([_, s]) => s === "done" || s === "unavailable");
  const isScanning = running.length > 0;

  if (!visible) return null;

  return (
    <Box
      width="100%"
      height="100%"
      justifyContent="center"
      alignItems="center"
      flexDirection="column"
      backgroundColor={colors.bg}
    >
      <Text bold color={colors.accent}>
        {"\u26A1"} cruft
      </Text>
      <Text color={colors.textMuted}>system inventory & cleanup — v0.1.0</Text>

      <Box marginTop={2} flexDirection="column" width={50}>
        {isScanning && (
          <Box marginBottom={1} justifyContent="center">
            <ProgressBar />
          </Box>
        )}

        {running.map(([id]) => (
          <Box key={id}>
            <AnimatedSpinner />
            <Text color={colors.text}> {SOURCE_LABELS[id] ?? id}</Text>
            <Text color={colors.textDim}> scanning...</Text>
          </Box>
        ))}
        {done.map(([id, status]) => (
          <Box key={id}>
            <Text color={status === "done" ? colors.success : colors.textDim}>
              {status === "done" ? "\u2713" : "\u2014"}
            </Text>
            <Text color={status === "done" ? colors.text : colors.textDim}> {SOURCE_LABELS[id] ?? id}</Text>
            {status === "done" && <Text color={colors.success}> ready</Text>}
            {status === "unavailable" && <Text color={colors.textDim}> skipped</Text>}
          </Box>
        ))}
      </Box>

      {!isScanning && (
        <Box marginTop={2} alignItems="center" flexDirection="column">
          {items.size > 0 ? (
            <>
              <Text bold color={colors.warning}>
                Found {items.size} item{items.size !== 1 ? "s" : ""} to clean
              </Text>
              <Box marginTop={1}>
                <Text color={colors.text}>Press any key to continue</Text>
              </Box>
              <Box marginTop={1}>
                <Text color={colors.textMuted}>
                  Use {"\u2191\u2193"} to navigate {"\u2423"} to select Enter to clean
                </Text>
              </Box>
            </>
          ) : (
            <>
              <Text bold color={colors.success}>
                Your system looks clean!
              </Text>
              <Box marginTop={1}>
                <Text color={colors.textMuted}>No cruft found. Try running again later.</Text>
              </Box>
            </>
          )}
        </Box>
      )}
    </Box>
  );
}
