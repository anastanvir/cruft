import consola from "consola";

const isTest = typeof process !== "undefined" && process.env?.NODE_ENV === "test";

export function createLogger(module: string) {
  const logger = isTest ? consola.withTag(module).withTag("test") : consola.withTag(module);

  return {
    info: (msg: string, ...args: unknown[]) => logger.info(msg, ...args),
    warn: (msg: string, ...args: unknown[]) => logger.warn(msg, ...args),
    error: (msg: string, ...args: unknown[]) => logger.error(msg, ...args),
    debug: (msg: string, ...args: unknown[]) => logger.debug(msg, ...args),
    success: (msg: string, ...args: unknown[]) => logger.success(msg, ...args),
  };
}
