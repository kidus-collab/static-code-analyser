import type { LineCounts } from "../types.js";

type CommentState = {
  block: boolean;
};

export function countSourceLines(text: string): LineCounts {
  const lines = text.split(/\r?\n/);
  const state: CommentState = { block: false };
  let sloc = 0;
  let comments = 0;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    if (isCommentOnlyLine(trimmed)) comments++;
    if (stripLineComment(rawLine, state).trim()) sloc++;
  }

  return { sloc, comments, physical: lines.length };
}

function isCommentOnlyLine(trimmed: string): boolean {
  return (
    trimmed.startsWith("//") ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("*") ||
    trimmed.startsWith("/*")
  );
}

function stripLineComment(line: string, state: CommentState): string {
  let source = line;

  if (state.block) {
    const end = source.indexOf("*/");
    if (end < 0) return "";
    source = source.slice(end + 2);
    state.block = false;
  }

  let out = "";
  for (let i = 0; i < source.length; i++) {
    if (source[i] === "/" && source[i + 1] === "*") {
      const end = source.indexOf("*/", i + 2);
      if (end >= 0) {
        i = end + 1;
        continue;
      }
      state.block = true;
      break;
    }
    if (source[i] === "/" && source[i + 1] === "/") break;
    if (source[i] === "#" && /^\s*#/.test(source.slice(0, i + 1))) break;
    out += source[i];
  }

  return out;
}
