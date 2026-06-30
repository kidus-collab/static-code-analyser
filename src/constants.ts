export const DEFAULT_SOURCE_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".vue",
  ".php",
  ".css",
  ".scss",
  ".prisma"
]);

export const DEFAULT_CODE_EXTENSIONS = new Set([
  ".js",
  ".jsx",
  ".ts",
  ".tsx",
  ".vue",
  ".php"
]);

export const DEFAULT_IGNORED_DIRS = new Set([
  "node_modules",
  "vendor",
  "dist",
  "build",
  ".next",
  ".git",
  ".turbo",
  ".cache",
  "coverage",
  "out",
  "public",
  "storage",
  ".expo",
  ".vercel",
  "ios",
  "android",
  ".claude",
  ".kilo"
]);

export const TEST_DIRS = new Set([
  "tests",
  "test",
  "__tests__",
  "spec",
  "workbench"
]);
