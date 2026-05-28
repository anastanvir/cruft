import { Text } from "ink";
import * as colors from "../theme/colors.ts";
import { progressBlocks } from "../theme/icons.ts";

export function ProgressBar({ percent, width = 20 }: { percent: number; width?: number }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const filled = Math.floor((clamped / 100) * width);
  const partial = (clamped / 100) * width - filled;
  const partialIdx = Math.floor(partial * progressBlocks.length);
  const partialBlock = partialIdx > 0 ? progressBlocks[Math.min(partialIdx, progressBlocks.length - 1)] : "";

  const bar = "█".repeat(filled) + partialBlock + " ".repeat(Math.max(0, width - filled - (partialBlock ? 1 : 0)));

  return (
    <Text color={colors.accent}>
      {bar} {Math.round(clamped)}%
    </Text>
  );
}
