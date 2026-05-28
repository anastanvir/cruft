import consola from "consola";
import { execa } from "execa";
import type { z } from "zod";

const DEFAULT_TIMEOUT = 10_000;

export interface ExecResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export async function exec(argv: string[], opts?: { timeout?: number; cwd?: string }): Promise<ExecResult> {
  const timeout = opts?.timeout ?? DEFAULT_TIMEOUT;
  const abortController = new AbortController();
  const timer = setTimeout(() => abortController.abort(), timeout);

  try {
    const [file, ...args] = argv;
    if (!file) {
      throw new Error("Empty command");
    }
    const result = await execa(file, args, {
      cancelSignal: abortController.signal,
      cwd: opts?.cwd,
      reject: false,
    });
    return {
      stdout: result.stdout ?? "",
      stderr: result.stderr ?? "",
      exitCode: result.exitCode,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function execJSON<T>(
  argv: string[],
  schema: z.ZodSchema<T>,
  opts?: { timeout?: number; cwd?: string },
): Promise<T> {
  const result = await exec(argv, opts);
  if (result.exitCode !== 0) {
    throw new Error(`Command failed (${result.exitCode}): ${argv.join(" ")}\n${result.stderr}`);
  }
  try {
    const parsed = JSON.parse(result.stdout);
    return schema.parse(parsed);
  } catch (err) {
    consola.error(`Failed to parse JSON output from ${argv.join(" ")}`, err);
    throw err;
  }
}
