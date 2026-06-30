import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { isDirectory, normalizeRoot, pathExists, readJsonFile } from "./fs-utils.js";
import type { CliOptions, ProjectTarget } from "./types.js";

type ProjectMap = Record<string, string>;

export function resolveProjectTarget(input: string, options: CliOptions): ProjectTarget {
  const direct = resolveDirectPath(input);
  if (direct) return direct;

  const projectMap = loadProjectMap(options.configPath);
  const configured = projectMap[input];
  if (configured) {
    const root = normalizeRoot(configured, options.configPath ? path.dirname(options.configPath) : process.cwd());
    if (!isDirectory(root)) throw new Error(`Configured project "${input}" does not point to a directory: ${root}`);
    return { name: input, root };
  }

  const discovered = discoverByName(input, options.searchRoots);
  if (discovered) return discovered;

  throw new Error(
    `Could not resolve "${input}". Pass a folder path, add it to projects.json, or set STATIC_ANALYSER_PROJECTS.`
  );
}

export function defaultConfigPath(): string | undefined {
  const local = path.resolve(process.cwd(), "projects.json");
  if (pathExists(local)) return local;
  const besideDist = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../projects.json");
  if (pathExists(besideDist)) return besideDist;
  const sourceTree = path.resolve(path.dirname(new URL(import.meta.url).pathname), "../../projects.json");
  if (pathExists(sourceTree)) return sourceTree;
  return undefined;
}

export function parseSearchRoots(): string[] {
  const envRoots = process.env.STATIC_ANALYSER_SEARCH_ROOTS;
  if (envRoots) {
    return envRoots
      .split(path.delimiter)
      .map((root) => normalizeRoot(root))
      .filter(isDirectory);
  }

  const home = os.homedir();
  return [process.cwd(), home, path.join(home, "Desktop"), path.join(home, "Downloads")]
    .filter((root, index, arr) => arr.indexOf(root) === index)
    .filter(isDirectory);
}

function resolveDirectPath(input: string): ProjectTarget | null {
  const candidate = normalizeRoot(input);
  if (!isDirectory(candidate)) return null;
  return { name: path.basename(candidate), root: candidate };
}

function loadProjectMap(configPath?: string): ProjectMap {
  const fromFile = configPath ? readJsonFile<ProjectMap>(configPath) ?? {} : {};
  return { ...fromEnv(), ...fromFile };
}

function fromEnv(): ProjectMap {
  const raw = process.env.STATIC_ANALYSER_PROJECTS;
  if (!raw) return {};

  try {
    return JSON.parse(raw) as ProjectMap;
  } catch {
    return Object.fromEntries(
      raw
        .split(";")
        .map((pair) => pair.trim())
        .filter(Boolean)
        .map((pair) => {
          const [name, ...pathParts] = pair.split("=");
          return [name.trim(), pathParts.join("=").trim()];
        })
    );
  }
}

function discoverByName(projectName: string, roots: string[]): ProjectTarget | null {
  for (const root of roots) {
    const direct = path.join(root, projectName);
    if (isDirectory(direct)) return { name: projectName, root: direct };
  }
  return null;
}
