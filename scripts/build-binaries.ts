import { $ } from "bun";

const targets = ["bun-darwin-arm64", "bun-darwin-x64"];

async function main() {
  for (const target of targets) {
    const outName = target.includes("arm64") ? "cruft" : "cruft-x64";
    console.log(`Building for ${target}...`);
    await $`bun build --compile --minify --target=${target} ./src/index.tsx --outfile ./dist/${outName}`;
    console.log(`  -> dist/${outName}`);
  }
}

await main();
