import fs from "node:fs";
import { findComposerFiles, findPackageFiles, readJsonFile } from "./fs-utils.js";

type PackageJson = {
  workspaces?: unknown;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

type ComposerJson = {
  require?: Record<string, string>;
  "require-dev"?: Record<string, string>;
};

export function detectFrameworks(root: string, includeTests: boolean): string {
  const hints = new Set<string>();

  for (const packageFile of findPackageFiles(root, includeTests)) {
    const pkg = readJsonFile<PackageJson>(packageFile);
    if (!pkg) continue;
    const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };

    if (deps.next) hints.add(`Next.js ${deps.next}`);
    if (deps.react && !deps.next) hints.add(`React ${deps.react}`);
    if (deps.vite) hints.add(`Vite ${deps.vite}`);
    if (deps.vue) hints.add(`Vue ${deps.vue}`);
    if (deps.expo) hints.add(`Expo ${deps.expo}`);
    if (deps.electron) hints.add(`Electron ${deps.electron}`);
    if (deps.express) hints.add(`Express ${deps.express}`);
    if (deps.fastify) hints.add(`Fastify ${deps.fastify}`);
    if (deps.prisma || deps["@prisma/client"]) hints.add(`Prisma ${deps.prisma ?? deps["@prisma/client"]}`);
    if (pkg.workspaces) hints.add("npm workspaces");
  }

  for (const composerFile of findComposerFiles(root, includeTests)) {
    if (!fs.existsSync(composerFile)) continue;
    const composer = readJsonFile<ComposerJson>(composerFile);
    if (!composer) continue;
    const deps = { ...(composer.require ?? {}), ...(composer["require-dev"] ?? {}) };

    if (deps["laravel/framework"]) hints.add(`Laravel ${deps["laravel/framework"]}`);
    if (deps["inertiajs/inertia-laravel"]) hints.add(`Inertia Laravel ${deps["inertiajs/inertia-laravel"]}`);
  }

  return [...hints].join(", ");
}
