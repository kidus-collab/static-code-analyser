import type { AnalysisSummary } from "./types.js";

export function renderSummary(summary: AnalysisSummary): string {
  const rows = [
    ["Project", summary.name],
    ["Root", summary.root],
    ["Framework", summary.framework || "Unknown"],
    ["Rating", `${summary.rating}/10 (${summary.ratingLabel})`],
    ["SLOC", formatNumber(summary.sloc)],
    ["Maintainability Index", summary.maintainabilityIndex.toString()],
    ["Avg Cyclomatic / function", summary.cyclomatic.avgPerFunction.toString()],
    ["Avg Cognitive / file", summary.cognitive.avgPerCodeFile.toString()],
    ["LCOM", summary.lcom === null ? "N/A" : summary.lcom.toString()],
    ["Coupling Ce/Ca", `${summary.coupling.avgCe}/${summary.coupling.avgCa}`],
    ["Instability", summary.coupling.instability.toString()]
  ];

  const lines = [
    "",
    "Static Analysis Summary",
    "=======================",
    ...rows.map(([label, value]) => `${label.padEnd(28)} ${value}`),
    "",
    "Worst Hotspots",
    "--------------",
    renderHotspotTable(summary)
  ];

  return lines.join("\n");
}

function renderHotspotTable(summary: AnalysisSummary): string {
  if (!summary.topHotspots.length) return "No code files were found.";

  const headers = ["File", "SLOC", "CC", "Cog", "MI", "Funcs"];
  const rows = summary.topHotspots.map((file) => [
    trimMiddle(file.file, 58),
    formatNumber(file.sloc),
    file.cyclomatic.toString(),
    file.cognitive.toString(),
    file.maintainabilityIndex.toString(),
    file.functionCount.toString()
  ]);

  const widths = headers.map((header, i) => Math.max(header.length, ...rows.map((row) => row[i].length)));
  const renderRow = (row: string[]) => row.map((cell, i) => cell.padEnd(widths[i])).join("  ");

  return [
    renderRow(headers),
    renderRow(widths.map((width) => "-".repeat(width))),
    ...rows.map(renderRow)
  ].join("\n");
}

function trimMiddle(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  const keep = Math.floor((maxLength - 3) / 2);
  return `${value.slice(0, keep)}...${value.slice(value.length - keep)}`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
