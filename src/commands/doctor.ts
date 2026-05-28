import { exec } from "../lib/exec.ts";

interface ToolCheck {
  name: string;
  args: string[];
  required: boolean;
}

const TOOLS: ToolCheck[] = [
  { name: "Homebrew", args: ["brew", "--version"], required: false },
  { name: "mas", args: ["mas", "version"], required: false },
  { name: "Docker", args: ["docker", "--version"], required: false },
  { name: "Xcode", args: ["xcode-select", "-p"], required: false },
  { name: "npm", args: ["npm", "--version"], required: false },
  { name: "pyenv", args: ["pyenv", "--version"], required: false },
  { name: "rbenv", args: ["rbenv", "--version"], required: false },
];

export async function doctorCommand(): Promise<void> {
  console.log("cruft doctor — checking environment\n");

  const results = await Promise.all(
    TOOLS.map(async (tool) => {
      const result = await exec(tool.args);
      return { ...tool, found: result.exitCode === 0, output: result.stdout.trim() };
    }),
  );

  let allGood = true;

  for (const r of results) {
    if (r.found) {
      console.log(`  ✔ ${r.name}: ${r.output}`);
    } else {
      console.log(`  ✖ ${r.name}: not found`);
      allGood = false;
    }
  }

  if (allGood) {
    console.log("\nAll optional tools detected. Ready to scan.");
  } else {
    console.log("\nSome optional tools are missing. cruft will skip their scanners.");
  }
}
