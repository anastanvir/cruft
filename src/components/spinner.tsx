import { Text } from "ink";
import { useEffect, useState } from "react";
import * as colors from "../theme/colors.ts";
import { spinnerFrames } from "../theme/icons.ts";

export function Spinner({ text }: { text?: string }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((f) => (f + 1) % spinnerFrames.length);
    }, 80);
    return () => clearInterval(timer);
  }, []);

  return (
    <Text color={colors.info}>
      {spinnerFrames[frame]} {text ?? "Loading…"}
    </Text>
  );
}
