import { exec } from "../lib/exec.ts";
import type { Item, Scanner } from "./types.ts";

interface DockerImage {
  ID: string;
  Repository: string;
  Tag: string;
  Size: string;
  CreatedAt: string;
}

interface DockerVolume {
  Name: string;
  Driver: string;
  Mountpoint: string;
  Size: string;
}

export const dockerScanner: Scanner = {
  id: "docker",
  displayName: "Docker",

  async available(): Promise<boolean> {
    try {
      const result = await exec(["docker", "info"]);
      return result.exitCode === 0;
    } catch {
      return false;
    }
  },

  async scan({ onItem, signal }): Promise<void> {
    if (signal.aborted) {
      return;
    }

    const imagesResult = await exec(["docker", "images", "--format", "json"]);
    if (imagesResult.exitCode === 0 && !signal.aborted) {
      const danglingImageIds: string[] = [];
      let danglingSizeBytes = 0;

      try {
        const lines = imagesResult.stdout.trim().split("\n");
        for (const line of lines) {
          if (!line.trim()) {
            continue;
          }
          const img: DockerImage = JSON.parse(line);
          if (img.Repository === "<none>" && img.Tag === "<none>") {
            danglingImageIds.push(img.ID);
            const sizeMatch = img.Size.match(/^([\d.]+)\s*(GB|MB|KB|B)$/);
            if (sizeMatch) {
              const val = Number.parseFloat(sizeMatch[1]);
              const unit = sizeMatch[2];
              if (unit === "GB") {
                danglingSizeBytes += val * 1_000_000_000;
              } else if (unit === "MB") {
                danglingSizeBytes += val * 1_000_000;
              } else if (unit === "KB") {
                danglingSizeBytes += val * 1_000;
              } else {
                danglingSizeBytes += val;
              }
            }
          }
        }
      } catch {
        // parse error
      }

      if (danglingImageIds.length > 0) {
        const item: Item = {
          id: "docker:dangling-images",
          source: "docker",
          name: `Docker dangling images (${danglingImageIds.length})`,
          sizeBytes: danglingSizeBytes,
          riskLevel: "safe",
          reason: "Dangling images — no tag, no container reference",
          removeStrategy: {
            kind: "exec",
            argv: ["docker", "image", "prune", "-f"],
          },
        };
        onItem(item);
      }
    }

    if (signal.aborted) {
      return;
    }

    const volumesResult = await exec(["docker", "volume", "ls", "--filter", "dangling=true", "--format", "json"]);

    if (volumesResult.exitCode === 0 && !signal.aborted) {
      const volumeNames: string[] = [];
      try {
        const lines = volumesResult.stdout.trim().split("\n");
        for (const line of lines) {
          if (!line.trim()) {
            continue;
          }
          const vol: DockerVolume = JSON.parse(line);
          volumeNames.push(vol.Name);
        }
      } catch {
        // parse error
      }

      if (volumeNames.length > 0) {
        const item: Item = {
          id: "docker:unused-volumes",
          source: "docker",
          name: `Docker unused volumes (${volumeNames.length})`,
          sizeBytes: 0,
          riskLevel: "safe",
          reason: "Unused volumes — no container reference",
          removeStrategy: {
            kind: "exec",
            argv: ["docker", "volume", "rm", ...volumeNames],
          },
        };
        onItem(item);
      }
    }
  },
};
