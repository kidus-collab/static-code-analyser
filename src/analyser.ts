import fs from "node:fs";
import path from "node:path";
import { DEFAULT_CODE_EXTENSIONS } from "./constants.js";
import { detectFrameworks } from "./framework.js";
import { cyclomaticComplexity, cognitiveComplexity, countFunctions } from "./metrics/complexity.js";
import { parseImports, resolveRelativeImport, summarizeCoupling } from "./metrics/coupling.js";
import { estimateHalsteadVolume } from "./metrics/halstead.js";
import { estimateLcom } from "./metrics/lcom.js";
import { countSourceLines } from "./metrics/line-counts.js";
import { maintainabilityIndex } from "./metrics/maintainability.js";
import { rate } from "./rating.js";
import type { AnalysisSummary, FileMetric, ProjectTarget } from "./types.js";
import { walkSourceFiles } from "./fs-utils.js";

export function analyseProject(project: ProjectTarget, topCount: number, includeTests: boolean): AnalysisSummary {
  const files = walkSourceFiles(project.root, includeTests);
  const fileSet = new Set(files);
  const extCounts: Record<string, number> = {};
  const fileMetrics: FileMetric[] = [];
  const lcomValues: number[] = [];
  const importMap = new Map<string, string[]>();
  const externalDeps = new Set<string>();

  let totalSloc = 0;
  let totalPhysical = 0;
  let totalCyclomatic = 0;
  let totalCognitive = 0;
  let totalFunctions = 0;
  let weightedMaintainability = 0;
  let maintainabilityWeight = 0;
  let maxCyclomatic = { value: 0, file: "" };
  let maxCognitive = { value: 0, file: "" };

  for (const file of files) {
    const text = readUtf8(file);
    if (text === null) continue;

    const ext = path.extname(file).toLowerCase();
    extCounts[ext] = (extCounts[ext] ?? 0) + 1;

    const lines = countSourceLines(text);
    totalSloc += lines.sloc;
    totalPhysical += lines.physical;

    if (!DEFAULT_CODE_EXTENSIONS.has(ext)) continue;

    const cc = cyclomaticComplexity(text);
    const cognitive = cognitiveComplexity(text);
    const functions = countFunctions(text);
    const mi = maintainabilityIndex(
      lines.sloc,
      cc,
      estimateHalsteadVolume(text),
      lines.comments / Math.max(1, lines.physical)
    );
    const relativeFile = path.relative(project.root, file).replaceAll("\\", "/");

    totalCyclomatic += cc;
    totalCognitive += cognitive;
    totalFunctions += functions;
    weightedMaintainability += mi * Math.max(1, lines.sloc);
    maintainabilityWeight += Math.max(1, lines.sloc);

    if (cc > maxCyclomatic.value) maxCyclomatic = { value: cc, file: relativeFile };
    if (cognitive > maxCognitive.value) maxCognitive = { value: cognitive, file: relativeFile };

    const lcom = estimateLcom(text);
    if (lcom !== null) lcomValues.push(lcom);

    const imports = parseImports(file, text);
    imports.external.forEach((dep) => externalDeps.add(dep));
    importMap.set(
      file,
      imports.relative
        .map((specifier) => resolveRelativeImport(file, specifier, fileSet))
        .filter((resolved): resolved is string => Boolean(resolved))
    );

    fileMetrics.push({
      file: relativeFile,
      sloc: lines.sloc,
      cyclomatic: cc,
      cognitive,
      maintainabilityIndex: round(mi),
      functionCount: functions
    });
  }

  fileMetrics.sort((a, b) => b.cognitive + b.cyclomatic - (a.cognitive + a.cyclomatic));

  const summaryWithoutRating = {
    name: project.name,
    root: project.root,
    framework: detectFrameworks(project.root, includeTests),
    files: files.length,
    extCounts,
    sloc: totalSloc,
    physicalLines: totalPhysical,
    cyclomatic: {
      total: totalCyclomatic,
      avgPerFunction: round(totalFunctions ? totalCyclomatic / totalFunctions : totalCyclomatic / Math.max(1, fileMetrics.length)),
      maxFile: maxCyclomatic
    },
    cognitive: {
      total: totalCognitive,
      avgPerCodeFile: round(fileMetrics.length ? totalCognitive / fileMetrics.length : 0),
      maxFile: maxCognitive
    },
    maintainabilityIndex: round(maintainabilityWeight ? weightedMaintainability / maintainabilityWeight : 100),
    lcom: lcomValues.length ? round(lcomValues.reduce((sum, value) => sum + value, 0) / lcomValues.length) : null,
    lcomClassCount: lcomValues.length,
    coupling: roundCoupling(summarizeCoupling(importMap, files, externalDeps)),
    topHotspots: fileMetrics.slice(0, topCount)
  };

  const rated = rate(summaryWithoutRating);
  return {
    ...summaryWithoutRating,
    rating: rated.rating,
    ratingLabel: rated.label
  };
}

function readUtf8(file: string): string | null {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return null;
  }
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function roundCoupling(coupling: ReturnType<typeof summarizeCoupling>): ReturnType<typeof summarizeCoupling> {
  return {
    internalEdges: coupling.internalEdges,
    avgCe: round(coupling.avgCe),
    avgCa: round(coupling.avgCa),
    instability: round(coupling.instability),
    externalDepCount: coupling.externalDepCount
  };
}

