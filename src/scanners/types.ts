export type Source =
  | "apps"
  | "homebrew"
  | "mas"
  | "npm-global"
  | "docker"
  | "xcode"
  | "node-modules"
  | "version-managers"
  | "caches";

export type RiskLevel = "safe" | "low" | "medium" | "high";

export type RemoveStrategy =
  | { kind: "trash"; paths: string[] }
  | { kind: "exec"; argv: string[]; cwd?: string }
  | { kind: "composite"; steps: RemoveStrategy[] };

export interface Item {
  id: string;
  source: Source;
  name: string;
  path?: string;
  sizeBytes: number;
  lastUsed?: Date;
  installSource?: string;
  dependents?: string[];
  riskLevel: RiskLevel;
  reason?: string;
  removeStrategy: RemoveStrategy;
}

export const RISK_ORDER: Record<RiskLevel, number> = {
  safe: 0,
  low: 1,
  medium: 2,
  high: 3,
};

export const RISK_LABELS: Record<RiskLevel, string> = {
  safe: "Safe",
  low: "Low Risk",
  medium: "Caution",
  high: "Unsafe",
};

export interface Scanner {
  id: Source;
  displayName: string;
  available(): Promise<boolean>;
  scan(opts: { onItem: (item: Item) => void; signal: AbortSignal }): Promise<void>;
}

export const ALL_SOURCES: Source[] = [
  "apps",
  "homebrew",
  "mas",
  "npm-global",
  "docker",
  "xcode",
  "node-modules",
  "version-managers",
  "caches",
];

export const SOURCE_LABELS: Record<Source, string> = {
  apps: "Apps",
  homebrew: "Homebrew",
  mas: "Mac App Store",
  "npm-global": "npm Globals",
  docker: "Docker",
  xcode: "Xcode",
  "node-modules": "node_modules",
  "version-managers": "Version Managers",
  caches: "Caches",
};
