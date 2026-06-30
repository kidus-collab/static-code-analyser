import type { AnalysisSummary } from "./types.js";

export function rate(summary: Omit<AnalysisSummary, "rating" | "ratingLabel">): { rating: number; label: string } {
  let score = 10;

  score -= maintainabilityPenalty(summary.maintainabilityIndex);
  score -= cognitivePenalty(summary.cognitive.avgPerCodeFile);
  score -= cyclomaticPenalty(summary.cyclomatic.avgPerFunction);
  score -= hotspotPenalty(summary.cognitive.maxFile.value, summary.cyclomatic.maxFile.value);

  const rating = roundToHalf(Math.max(1, Math.min(10, score)));
  return { rating, label: labelForRating(rating) };
}

function maintainabilityPenalty(mi: number): number {
  if (mi < 15) return 4;
  if (mi < 30) return 3;
  if (mi < 50) return 2;
  if (mi < 70) return 1;
  return 0;
}

function cognitivePenalty(avgCognitivePerFile: number): number {
  if (avgCognitivePerFile >= 300) return 3.5;
  if (avgCognitivePerFile >= 150) return 2.5;
  if (avgCognitivePerFile >= 75) return 1.5;
  if (avgCognitivePerFile >= 35) return 0.5;
  return 0;
}

function cyclomaticPenalty(avgCyclomaticPerFunction: number): number {
  if (avgCyclomaticPerFunction >= 12) return 2.5;
  if (avgCyclomaticPerFunction >= 8) return 1.5;
  if (avgCyclomaticPerFunction >= 4) return 0.5;
  return 0;
}

function hotspotPenalty(maxCognitiveFile: number, maxCyclomaticFile: number): number {
  let penalty = 0;
  if (maxCognitiveFile > 1000) penalty += 1.5;
  else if (maxCognitiveFile > 300) penalty += 0.75;
  else if (maxCognitiveFile > 100) penalty += 0.5;

  if (maxCyclomaticFile > 300) penalty += 1;
  else if (maxCyclomaticFile > 80) penalty += 0.5;
  else if (maxCyclomaticFile > 40) penalty += 0.25;

  return penalty;
}

function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

function labelForRating(rating: number): string {
  if (rating >= 8) return "healthy";
  if (rating >= 6) return "usable with hotspots";
  if (rating >= 4) return "needs refactor";
  return "high risk";
}
