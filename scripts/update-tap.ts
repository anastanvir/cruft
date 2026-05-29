import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { $ } from "bun";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const VERSION = process.env.VERSION ?? "0.1.0";
const ARM64_SHA = process.env.ARM64_SHA ?? "";
const X64_SHA = process.env.X64_SHA ?? "";

const TEMPLATE_PATH = resolve(__dirname, "../homebrew/kruft.rb.template");
const OUTPUT_PATH = resolve(__dirname, "../dist/kruft.rb");

async function main() {
  let template = readFileSync(TEMPLATE_PATH, "utf-8");
  template = template.replace(/{{VERSION}}/g, VERSION);
  template = template.replace(/{{ARM64_SHA}}/g, ARM64_SHA);
  template = template.replace(/{{X64_SHA}}/g, X64_SHA);
  writeFileSync(OUTPUT_PATH, template, "utf-8");
  console.log(`Updated ${OUTPUT_PATH}`);
}

await main();
