import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const SRC_ROOT = path.join(ROOT, "src");

const REQUIRED_FILES = [
  "AGENTS.md",
  "docs/product-scope.md",
  "docs/architecture.md",
  "docs/verification.md",
  "harness/harness-tasks.json",
  "harness/harness-progress.txt",
  "src/App.tsx",
  "src/main.tsx",
  "src/domain/model.ts",
  "src/persistence/storage.ts",
];

const ALLOWED_SRC_ROOT_NAMES = new Set(["App.tsx", "main.tsx", "styles.css", "domain", "persistence", "ui", "styles"]);

async function walk(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const results = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        return walk(target);
      }
      return [target];
    }),
  );

  return results.flat();
}

function collectImports(source: string): string[] {
  const imports: string[] = [];
  const pattern = /^\s*import\s+(?:.+?\s+from\s+)?["']([^"']+)["'];?/gm;
  let match = pattern.exec(source);

  while (match) {
    imports.push(match[1]);
    match = pattern.exec(source);
  }

  return imports;
}

async function main(): Promise<void> {
  const failures: string[] = [];

  for (const requiredFile of REQUIRED_FILES) {
    try {
      await readFile(path.join(ROOT, requiredFile), "utf8");
    } catch {
      failures.push(`Missing required file: ${requiredFile}`);
    }
  }

  const srcEntries = await readdir(SRC_ROOT, { withFileTypes: true });
  for (const entry of srcEntries) {
    if (!ALLOWED_SRC_ROOT_NAMES.has(entry.name)) {
      failures.push(`Unexpected src root entry: src/${entry.name}`);
    }
  }

  const allFiles = await walk(SRC_ROOT);
  for (const file of allFiles) {
    const relativeFile = path.relative(ROOT, file).replaceAll("\\", "/");
    if (relativeFile.endsWith(".bak")) {
      failures.push(`Backup file should not live in src: ${relativeFile}`);
      continue;
    }
  }

  const sourceFiles = allFiles.filter((file) => file.endsWith(".ts") || file.endsWith(".tsx"));
  for (const file of sourceFiles) {
    const relativeFile = path.relative(ROOT, file).replaceAll("\\", "/");
    const source = await readFile(file, "utf8");
    const imports = collectImports(source);

    if (relativeFile.startsWith("src/domain/")) {
      if (imports.some((target) => target.includes("react"))) {
        failures.push(`Domain file imports React: ${relativeFile}`);
      }
      if (imports.some((target) => target.includes("persistence") || target.includes("App"))) {
        failures.push(`Domain file crosses forbidden boundary: ${relativeFile}`);
      }
    }

    if (relativeFile.startsWith("src/persistence/")) {
      if (imports.some((target) => target.includes("react") || target.includes("App"))) {
        failures.push(`Persistence file crosses forbidden boundary: ${relativeFile}`);
      }
    }

  }

  if (failures.length > 0) {
    console.error("Architecture guardrails failed:");
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    process.exit(1);
  }

  console.log(`Architecture guardrails passed for ${sourceFiles.length} source files.`);
}

void main();
