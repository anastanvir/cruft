import { statSync } from "node:fs";
import { execa } from "execa";

export async function getLastUsed(path: string): Promise<Date | undefined> {
  try {
    const result = await execa("mdls", ["-name", "kMDItemLastUsedDate", path], { reject: false });
    if (result.exitCode === 0 && result.stdout) {
      const match = result.stdout.match(/= (.+)$/m);
      if (match?.[1]) {
        const date = new Date(match[1]);
        if (!Number.isNaN(date.getTime())) {
          return date;
        }
      }
    }
  } catch {
    // fallback to atime
  }

  try {
    const stats = statSync(path);
    return new Date(stats.atimeMs);
  } catch {
    return undefined;
  }
}
