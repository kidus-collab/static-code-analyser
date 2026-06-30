#!/usr/bin/env node
import { analyseProject } from "./analyser.js";
import { defaultConfigPath, parseSearchRoots, resolveProjectTarget } from "./config.js";
import { renderSummary } from "./report.js";
import type { CliOptions } from "./types.js";

const { target, options } = parseArgs(process.argv.slice(2));

if (!target) {
  printHelp();
  process.exit(1);
}

try {
  const project = resolveProjectTarget(target, options);
  const summary = analyseProject(project, options.top, options.includeTests);
  process.stdout.write(options.json ? `${JSON.stringify(summary, null, 2)}\n` : `${renderSummary(summary)}\n`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`analyse: ${message}\n`);
  process.exit(1);
}

function parseArgs(args: string[]): { target?: string; options: CliOptions } {
  const options: CliOptions = {
    json: false,
    top: 8,
    includeTests: false,
    configPath: defaultConfigPath(),
    searchRoots: parseSearchRoots()
  };
  let target: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--json") options.json = true;
    else if (arg === "--include-tests") options.includeTests = true;
    else if (arg === "--top") options.top = Number(readOptionValue(args, ++i, "--top"));
    else if (arg === "--config") options.configPath = readOptionValue(args, ++i, "--config");
    else if (arg === "--root") options.searchRoots.push(readOptionValue(args, ++i, "--root"));
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else if (!target) {
      target = arg;
    } else {
      throw new Error(`Unexpected argument: ${arg}`);
    }
  }

  if (!Number.isFinite(options.top) || options.top < 1) options.top = 8;
  return { target, options };
}

function readOptionValue(args: string[], index: number, optionName: string): string {
  const value = args[index];
  if (!value) throw new Error(`${optionName} requires a value.`);
  return value;
}
function printHelp(): void {
  process.stdout.write(`Static Code Analyser

Usage:
  analyse <project-name-or-folder> [options]
  node dist/cli.js <project-name-or-folder> [options]
  npm run analyse -- <project-name-or-folder> [options]

Options:
  --json             Print machine-readable JSON.
  --top <n>          Number of hotspot files to show. Default: 8.
  --include-tests    Include tests/workbench folders in the scan.
  --config <path>    Project-name map JSON. Default: ./projects.json when present.
  --root <path>      Extra root to search when target is a project name.
  --help             Show this help.

Environment:
  STATIC_ANALYSER_PROJECTS      JSON object or name=path;name=path list.
  STATIC_ANALYSER_SEARCH_ROOTS  Extra search roots separated by the OS path delimiter.
`);
}

