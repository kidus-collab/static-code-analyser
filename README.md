# Static Code Analyser

A dependency-light TypeScript CLI for quick static code health reviews. It reports:

- Source Lines of Code (`SLOC`)
- Maintainability Index (`MI`)
- Cyclomatic Complexity (`CC`)
- Cognitive Complexity
- Cohesion estimate (`LCOM`)
- Coupling estimates (`Ce`, `Ca`, instability)
- Framework / stack hints
- Worst hotspot files

This project replaces the temporary `static_metrics_tmp_filtered.js` script with a maintainable, modular TypeScript codebase.

## Quick Start

Install dependencies and build:

```bash
npm install
npm run build
```

Run by folder path:

```bash
npm run analyse -- "C:/Users/Kidus/Downloads/kidustracker"
```

Run by project name from `projects.json`:

```bash
npm run analyse -- kidustracker
```

After linking the package locally, you can use the CLI name directly:

```bash
npm link
analyse kidustracker
analyse "C:/Users/Kidus/Downloads/kidustracker"
```

JSON output:

```bash
analyse kidustracker --json
```

Show more hotspot files:

```bash
analyse Profitable --top 20
```

Include tests/workbench folders:

```bash
analyse mersconhr --include-tests
```

## Project Names

The analyser does not hard-code project paths in source code. Project names are resolved in this order:

1. A direct folder path, for example `analyse C:/Users/Kidus/ETCRM`.
2. `STATIC_ANALYSER_PROJECTS` environment variable.
3. `projects.json`.
4. Search roots: current directory, home directory, Desktop, Downloads, and any roots supplied with `--root`.

projects.json is intentionally ignored by Git because it normally contains machine-specific local paths. Copy `projects.example.json` to `projects.json` for your own machine.

Example `projects.json`:

```json
{
  "kidustracker": "C:/Users/Kidus/Downloads/kidustracker",
  "ETCRM": "C:/Users/Kidus/ETCRM"
}
```

Environment variable as JSON:

```bash
STATIC_ANALYSER_PROJECTS='{"kidustracker":"C:/Users/Kidus/Downloads/kidustracker"}'
```

Environment variable as a compact list:

```bash
STATIC_ANALYSER_PROJECTS='kidustracker=C:/Users/Kidus/Downloads/kidustracker;ETCRM=C:/Users/Kidus/ETCRM'
```

## What The Metrics Mean

### SLOC

`SLOC` means Source Lines of Code: non-empty, non-comment source lines. It is a size metric, not automatically a quality score.

Project-level SLOC tells you the size of the codebase. A 60,000 SLOC project can be healthy if it is modular and tested. File-level SLOC is more important for maintainability.

File-level rough guide:

| File SLOC | Meaning |
|---:|---|
| `< 150` | Usually easy to review. |
| `150 - 400` | Normal for substantial modules, but watch complexity. |
| `400 - 800` | Refactor candidate, especially for UI pages/controllers. |
| `800 - 1,500` | High-risk file. Split responsibilities. |
| `> 1,500` | Very high risk. Usually a God file. |

So when you see `6658 SLOC` for one file, that is bad. It means a single file is carrying far too many responsibilities. It will be hard to review, test, debug, and safely change. For example, `apps/web/src/pages/Journal.tsx` in `Profitable` at `6,658 SLOC` should be split into smaller page sections, hooks, services, table components, chart components, and state modules.

### Cyclomatic Complexity (`CC`)

Cyclomatic Complexity estimates how many independent execution paths exist. More branches mean more test cases are needed.

Rough guide per function:

| CC | Meaning |
|---:|---|
| `1 - 5` | Good. |
| `6 - 10` | Watch. Add focused tests. |
| `11 - 20` | High. Consider splitting. |
| `> 20` | Very high. Refactor strongly recommended. |

This tool also reports file-level max CC. A file CC of `300+` usually means the file contains too much conditional logic.

### Cognitive Complexity

Cognitive Complexity estimates how hard code is for a person to understand. Deep nesting, conditionals, switches, and boolean branching increase the score.

This analyser reports cognitive complexity per file. File-level guide:

| Cognitive / file | Meaning |
|---:|---|
| `< 35` | Usually manageable. |
| `35 - 75` | Needs review. |
| `75 - 150` | Hard to reason about. |
| `150 - 300` | High refactor pressure. |
| `> 300` | Severe hotspot. |

### Maintainability Index (`MI`)

Maintainability Index is a 0-100 score. Higher is better. This analyser uses the classic MI formula with an estimated Halstead volume.

Rough guide:

| MI | Meaning |
|---:|---|
| `70 - 100` | Good. |
| `50 - 69` | Moderate. |
| `30 - 49` | Risky. |
| `< 30` | Poor maintainability. |

An MI of `0` on a file usually means the file is very large and complex. It should be split before adding more features.

### LCOM

`LCOM` estimates Lack of Cohesion of Methods for class-based code. Lower is better.

| LCOM | Meaning |
|---:|---|
| `0 - 0.3` | Cohesive. |
| `0.3 - 0.6` | Mixed responsibilities. |
| `0.6 - 1.0` | Low cohesion. Consider splitting class. |

For React functional components and function-heavy modules, LCOM is often `N/A`.

### Coupling: `Ce`, `Ca`, Instability

- `Ce` means efferent coupling: outgoing internal dependencies from a file.
- `Ca` means afferent coupling: incoming internal dependencies to a file.
- Instability is `Ce / (Ce + Ca)`.

Rough interpretation:

| Instability | Meaning |
|---:|---|
| Near `0` | Stable: many depend on it, it depends on few. |
| Near `1` | Unstable: depends on many, few depend on it. |

This is useful for architecture trends, not as a pass/fail rule.

## How The Logic Works

The analyser walks source files under the target folder and excludes dependency/build/generated folders by default:

- `node_modules`, `vendor`, `dist`, `build`, `.next`, `.git`, `.turbo`, `.cache`, `coverage`, `out`, `public`, `storage`, `.expo`, `.vercel`, `ios`, `android`, `.claude`, `.kilo`
- test/workbench folders are excluded unless `--include-tests` is passed

For each source file it:

1. Counts physical lines and SLOC after removing blank/comment-only lines.
2. Estimates Cyclomatic Complexity by counting branch tokens such as `if`, `for`, `case`, `catch`, `?`, `&&`, and `||`.
3. Estimates Cognitive Complexity from branch tokens plus nesting depth.
4. Estimates Halstead volume from operators and operands.
5. Calculates Maintainability Index from SLOC, CC, Halstead volume, and comment percentage.
6. Estimates LCOM for class-style code by checking whether methods share object fields.
7. Estimates coupling by resolving relative imports and counting internal incoming/outgoing edges.
8. Detects framework hints from `package.json` and `composer.json`.

## Can You Trust It?

Trust it as a fast hotspot detector and trend tool. Do not treat it as a certified compiler-grade static analyser.

Strengths:

- No project-specific hard-coding.
- Excludes common dependency and generated folders.
- Good at finding oversized files and obvious complexity hotspots.
- Works across mixed JS/TS/Vue/PHP projects without installing language-specific analysers.
- Stable enough for comparing the same project over time.

Limitations:

- Complexity is token/regex based, not AST based.
- TypeScript path aliases are not fully resolved.
- PHP namespace coupling is approximate.
- Vue single-file component parsing is approximate.
- MI uses estimated Halstead volume, so the score is directional rather than exact.

For high-confidence production gates, use this alongside language-native tools:

- JavaScript/TypeScript: ESLint complexity rules, SonarQube/SonarCloud, `ts-prune`, dependency-cruiser.
- PHP/Laravel: PHPStan or Larastan, PHP Mess Detector, PDepend, Deptrac.
- Repository-level governance: CI thresholds and historical trend reports.

## Recommended Refactor Rule

Use this practical rule:

1. Start with the top 3 hotspot files.
2. Split files over `800 SLOC`.
3. Split functions/components with CC over `20`.
4. Extract repeated conditional logic into named functions.
5. Move API/data access out of UI pages.
6. Add tests before refactoring any file with high CC and business-critical behavior.

For the earlier `Profitable` result, `apps/web/src/pages/Journal.tsx` at `6,658 SLOC`, `CC 1381`, and `Cognitive 6889` is not just "large"; it is the first file to refactor.

