export const CYCLOMATIC_TOKEN_RE = /\b(if|else\s+if|for|foreach|while|case|catch)\b|\?|&&|\|\||\b(match)\b/g;
const COGNITIVE_TOKEN_RE = /\b(if|else\s+if|for|foreach|while|case|catch|switch)\b|\?|&&|\|\|/g;
const STRINGISH_RE = /(['"`]).*?\1/g;
const FUNCTION_RE = /\b(function\s+[A-Za-z0-9_$]+|function\s*\(|(?:const|let|var)\s+[A-Za-z0-9_$]+\s*=\s*(?:async\s*)?\(?[^=;]*?\)?\s*=>|(?:public|private|protected)?\s*(?:static\s+)?function\s+[A-Za-z0-9_]+|(?:export\s+default\s+)?(?:async\s+)?function\s+[A-Za-z0-9_$]+|[A-Za-z0-9_$]+\s*\([^)]*\)\s*\{)/g;

export function cyclomaticComplexity(text: string): number {
  return 1 + (text.match(CYCLOMATIC_TOKEN_RE)?.length ?? 0);
}

export function cognitiveComplexity(text: string): number {
  let score = 0;
  let nesting = 0;

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(STRINGISH_RE, "");
    nesting = Math.max(0, nesting - (line.match(/}/g)?.length ?? 0));

    const decisions = line.match(COGNITIVE_TOKEN_RE) ?? [];
    if (decisions.length) score += decisions.length + nesting;

    nesting += line.match(/{/g)?.length ?? 0;
  }

  return score;
}

export function countFunctions(text: string): number {
  return text.match(FUNCTION_RE)?.length ?? 0;
}
