const CLASS_RE = /class\s+[A-Za-z0-9_]+[\s\S]*/;
const FIELD_RE = /(?:this->|\$this->|this\.|self::|static::)([A-Za-z_][A-Za-z0-9_]*)/g;
const METHOD_SPLIT_RE = /\b(?:public|private|protected)?\s*(?:static\s+)?function\s+[A-Za-z0-9_]+\s*\(/;

export function estimateLcom(text: string): number | null {
  const classMatch = text.match(CLASS_RE);
  if (!classMatch) return null;

  const classBody = classMatch[0];
  if (!hasFields(classBody)) return null;

  const methodBodies = classBody.split(METHOD_SPLIT_RE).slice(1);
  const methodFieldSets = methodBodies
    .map(collectFieldUses)
    .filter((fieldSet) => fieldSet.size > 0);

  if (methodFieldSets.length < 2) return null;

  let sharedPairs = 0;
  let unsharedPairs = 0;

  for (let i = 0; i < methodFieldSets.length; i++) {
    for (let j = i + 1; j < methodFieldSets.length; j++) {
      if (setsOverlap(methodFieldSets[i], methodFieldSets[j])) sharedPairs++;
      else unsharedPairs++;
    }
  }

  const totalPairs = sharedPairs + unsharedPairs;
  return totalPairs ? unsharedPairs / totalPairs : null;
}

function hasFields(text: string): boolean {
  FIELD_RE.lastIndex = 0;
  return FIELD_RE.test(text);
}

function collectFieldUses(text: string): Set<string> {
  FIELD_RE.lastIndex = 0;
  const fields = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = FIELD_RE.exec(text))) fields.add(match[1]);
  return fields;
}

function setsOverlap(a: Set<string>, b: Set<string>): boolean {
  for (const value of a) {
    if (b.has(value)) return true;
  }
  return false;
}
