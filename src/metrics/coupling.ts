import path from "node:path";
import type { CouplingMetrics } from "../types.js";

const IMPORT_RE = /import(?:[^'"`]*?from\s*)?["']([^"']+)["']|require\(["']([^"']+)["']\)|dynamic\s*\(\s*\(\)\s*=>\s*import\(["']([^"']+)["']\)/g;
const PHP_USE_RE = /^\s*use\s+([^;]+);/gm;
const RESOLVE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".vue", ".php"];

export type ParsedImports = {
  external: string[];
  relative: string[];
};

export function parseImports(file: string, text: string): ParsedImports {
  const external: string[] = [];
  const relative: string[] = [];

  const addModule = (moduleName?: string) => {
    if (!moduleName) return;
    if (moduleName.startsWith(".") || moduleName.startsWith("/")) {
      relative.push(moduleName);
      return;
    }
    external.push(packageName(moduleName));
  };

  let match: RegExpExecArray | null;
  while ((match = IMPORT_RE.exec(text))) {
    addModule(match[1] || match[2] || match[3]);
  }

  if (path.extname(file).toLowerCase() === ".php") {
    while ((match = PHP_USE_RE.exec(text))) {
      external.push(match[1].trim().split("\\")[0]);
    }
  }

  return {
    external: [...new Set(external)],
    relative: [...new Set(relative)]
  };
}

export function resolveRelativeImport(from: string, specifier: string, fileSet: Set<string>): string | null {
  const base = path.resolve(path.dirname(from), specifier);
  const candidates = [
    base,
    ...RESOLVE_EXTENSIONS.map((ext) => base + ext),
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
    path.join(base, "index.js"),
    path.join(base, "index.jsx")
  ];

  return candidates.find((candidate) => fileSet.has(path.normalize(candidate))) ?? null;
}

export function summarizeCoupling(importMap: Map<string, string[]>, files: string[], externalDeps: Set<string>): CouplingMetrics {
  const afferent = new Map(files.map((file) => [file, 0]));
  const efferentValues: number[] = [];
  let internalEdges = 0;

  for (const dependencies of importMap.values()) {
    const uniqueDeps = [...new Set(dependencies)];
    internalEdges += uniqueDeps.length;
    efferentValues.push(uniqueDeps.length);

    for (const dependency of uniqueDeps) {
      afferent.set(dependency, (afferent.get(dependency) ?? 0) + 1);
    }
  }

  const caValues = [...afferent.values()].filter((value) => value > 0);
  const avgCe = average(efferentValues);
  const avgCa = average(caValues);

  return {
    internalEdges,
    avgCe,
    avgCa,
    instability: avgCe + avgCa ? avgCe / (avgCe + avgCa) : 0,
    externalDepCount: externalDeps.size
  };
}

function packageName(moduleName: string): string {
  if (moduleName.startsWith("@")) return moduleName.split("/").slice(0, 2).join("/");
  return moduleName.split("/")[0];
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}
