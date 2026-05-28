import { appsScanner } from "../scanners/apps.ts";
import { cachesScanner } from "../scanners/caches.ts";
import { dockerScanner } from "../scanners/docker.ts";
import { homebrewScanner } from "../scanners/homebrew.ts";
import { masScanner } from "../scanners/mas.ts";
import { nodeModulesScanner } from "../scanners/node-modules.ts";
import { npmGlobalScanner } from "../scanners/npm-global.ts";
import { ScannerRegistry } from "../scanners/registry.ts";
import type { Item } from "../scanners/types.ts";
import { versionManagersScanner } from "../scanners/version-managers.ts";
import { xcodeScanner } from "../scanners/xcode.ts";

export async function scanJSONCommand(): Promise<void> {
  const registry = new ScannerRegistry();

  registry.register(appsScanner);
  registry.register(homebrewScanner);
  registry.register(masScanner);
  registry.register(npmGlobalScanner);
  registry.register(dockerScanner);
  registry.register(xcodeScanner);
  registry.register(nodeModulesScanner);
  registry.register(versionManagersScanner);
  registry.register(cachesScanner);

  const items: Item[] = [];
  const abortController = new AbortController();

  await registry.runAll((item) => {
    items.push(item);
  }, abortController.signal);

  const output = {
    scannedAt: new Date().toISOString(),
    totalItems: items.length,
    items: items.map((item) => ({
      id: item.id,
      source: item.source,
      name: item.name,
      path: item.path,
      sizeBytes: item.sizeBytes,
      lastUsed: item.lastUsed?.toISOString() ?? null,
      installSource: item.installSource ?? null,
      riskLevel: item.riskLevel,
      reason: item.reason ?? null,
      removeStrategy: item.removeStrategy,
    })),
  };

  console.log(JSON.stringify(output, null, 2));
}
