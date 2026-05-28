import pMap from "p-map";
import type { Item, Scanner, Source } from "./types.ts";

type ScanCallback = (item: Item) => void;

export class ScannerRegistry {
  private scanners: Map<Source, Scanner> = new Map();

  register(scanner: Scanner): void {
    this.scanners.set(scanner.id, scanner);
  }

  get(id: Source): Scanner | undefined {
    return this.scanners.get(id);
  }

  getAll(): Scanner[] {
    return [...this.scanners.values()];
  }

  async getAvailable(): Promise<Scanner[]> {
    const scanners = this.getAll();
    const results = await pMap(scanners, async (s) => ({ scanner: s, available: await s.available() }), {
      concurrency: 8,
    });
    return results.filter((r) => r.available).map((r) => r.scanner);
  }

  async runAll(onItem: ScanCallback, signal: AbortSignal, concurrency = 8): Promise<void> {
    const available = await this.getAvailable();
    await pMap(
      available,
      async (scanner) => {
        if (signal.aborted) {
          return;
        }
        await scanner.scan({ onItem, signal });
      },
      { concurrency },
    );
  }
}
