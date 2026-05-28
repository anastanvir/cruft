import Fuse from "fuse.js";

interface FuzzyItem {
  id: string;
  name: string;
  source: string;
}

let fuse: Fuse<FuzzyItem> | null = null;
let indexedIds = 0;

export function buildIndex(items: { id: string; name: string; source: string }[]): void {
  if (items.length === indexedIds) {
    return;
  }
  fuse = new Fuse(items, {
    keys: ["name", "source"],
    threshold: 0.4,
    minMatchCharLength: 2,
  });
  indexedIds = items.length;
}

export function search(query: string, limit = 50): string[] {
  if (!fuse || !query) {
    return [];
  }
  const results = fuse.search(query, { limit });
  return results.map((r) => r.item.id);
}

export function resetIndex(): void {
  fuse = null;
  indexedIds = 0;
}
