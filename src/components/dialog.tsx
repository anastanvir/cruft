import { Box, Text } from "ink";
import type { ReactNode } from "react";
import * as colors from "../theme/colors.ts";

export const DIALOG_WIDTH = 68;
export const INNER_WIDTH = DIALOG_WIDTH - 2;
export const LEFT_PAD = 4;
export const CONTENT_WIDTH = INNER_WIDTH - LEFT_PAD;

export function padRow(content: string): string {
  const text = " ".repeat(LEFT_PAD) + content;
  const visibleLen = [...text].length;
  if (visibleLen >= INNER_WIDTH) return text.slice(0, INNER_WIDTH);
  return text + " ".repeat(INNER_WIDTH - visibleLen);
}

export function FillRow() {
  return <Text backgroundColor={colors.bgModal}>{" ".repeat(INNER_WIDTH)}</Text>;
}

export function DialogRow({
  children,
  bold,
  color,
}: {
  children: string;
  bold?: boolean;
  color?: string;
}) {
  return (
    <Text bold={bold} backgroundColor={colors.bgModal} color={color}>
      {padRow(children)}
    </Text>
  );
}

export function Dialog({
  borderColor,
  children,
}: {
  borderColor: string;
  children: ReactNode;
}) {
  return (
    <Box width={DIALOG_WIDTH} flexDirection="column" borderStyle="round" borderColor={borderColor}>
      <FillRow />
      {children}
      <FillRow />
    </Box>
  );
}
