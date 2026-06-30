import fs from "node:fs";
import path from "node:path";
import { DEFAULT_IGNORED_DIRS, DEFAULT_SOURCE_EXTENSIONS, TEST_DIRS } from "./constants.js";

export function pathExists(candidate: string): boolean {
  try {
    return fs.existsSync(candidate);
  } catch {
    return false;
  }
}

export function isDirectory(candidate: string): boolean {
  try {
    return fs.statSync(candidate).isDirectory();
  } catch {
    return false;
  }
}

export function readJsonFile<T>(filePath: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

export function normalizeRoot(root: string, baseDir = process.cwd()): string {
  return path.resolve(baseDir, root);
}

export function walkSourceFiles(root: string, includeTests: boolean): string[] {
  const ignored = new Set(DEFAULT_IGNORED_DIRS);
  if (!includeTests) {
    for (const dir of TEST_DIRS) ignored.add(dir);
  }

  const files: string[] = [];
  const visit = (dir: string) => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!ignored.has(entry.name)) visit(fullPath);
        continue;
      }

      const ext = path.extname(entry.name).toLowerCase();
      if (DEFAULT_SOURCE_EXTENSIONS.has(ext)) files.push(path.normalize(fullPath));
    }
  };

  visit(root);
  return files;
}

export function findPackageFiles(root: string, includeTests: boolean): string[] {
  return walkAllFiles(root, "package.json", includeTests);
}

export function findComposerFiles(root: string, includeTests: boolean): string[] {
  return walkAllFiles(root, "composer.json", includeTests);
}

function walkAllFiles(root: string, fileName: string, includeTests: boolean): string[] {
  const ignored = new Set(DEFAULT_IGNORED_DIRS);
  if (!includeTests) {
    for (const dir of TEST_DIRS) ignored.add(dir);
  }

  const files: string[] = [];
  const visit = (dir: string) => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!ignored.has(entry.name)) visit(fullPath);
      } else if (entry.name === fileName) {
        files.push(path.normalize(fullPath));
      }
    }
  };

  visit(root);
  return files;
}
