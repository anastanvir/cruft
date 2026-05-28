import trash from "trash";
import { exec as execCmd } from "../lib/exec.ts";
import type { RemoveStrategy } from "../scanners/types.ts";
import { isExecAllowed } from "./exec-allowlist.ts";
import type { RemovalStep } from "./plan.ts";

export interface RemovalResult {
  itemId: string;
  success: boolean;
  error?: string;
}

export async function executeRemoval(steps: RemovalStep[]): Promise<RemovalResult[]> {
  const results: RemovalResult[] = [];

  for (const step of steps) {
    try {
      await executeStrategy(step.strategy);
      results.push({ itemId: step.itemId, success: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({ itemId: step.itemId, success: false, error: message });
    }
  }

  return results;
}

async function executeStrategy(strategy: RemoveStrategy): Promise<void> {
  switch (strategy.kind) {
    case "trash": {
      if (strategy.paths.length === 1) {
        await trash(strategy.paths[0]);
      } else if (strategy.paths.length > 1) {
        await trash(strategy.paths);
      }
      break;
    }
    case "exec": {
      const guard = isExecAllowed(strategy.argv);
      if (!guard.ok) {
        throw new Error(`Refused exec: ${guard.reason}`);
      }
      const result = await execCmd(strategy.argv, { cwd: strategy.cwd });
      if (result.exitCode !== 0) {
        throw new Error(`Command failed (${result.exitCode}): ${strategy.argv.join(" ")}\n${result.stderr}`);
      }
      break;
    }
    case "composite": {
      for (const step of strategy.steps) {
        await executeStrategy(step);
      }
      break;
    }
  }
}
