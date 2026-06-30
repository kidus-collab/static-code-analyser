const STRING_LITERAL_RE = /`(?:\\.|[^`])*`|'(?:\\.|[^'])*'|"(?:\\.|[^"])*"/g;
const OPERATOR_RE = /=>|===|!==|==|!=|<=|>=|&&|\|\||\+\+|--|[+\-*\/%=<>!?:.]|\b(if|else|for|foreach|while|case|catch|switch|return|throw|await|try|new|class|function|extends|implements|import|export|use)\b/g;
const OPERAND_RE = /\b[A-Za-z_$][A-Za-z0-9_$]*\b|\b\d+(?:\.\d+)?\b/g;

export function estimateHalsteadVolume(text: string): number {
  const noStrings = text.replace(STRING_LITERAL_RE, "STR");
  const operators = noStrings.match(OPERATOR_RE) ?? [];
  const operands = noStrings.match(OPERAND_RE) ?? [];

  const distinctOperators = new Set(operators).size || 1;
  const distinctOperands = new Set(operands).size || 1;
  const totalTokens = (operators.length || 1) + (operands.length || 1);
  const vocabulary = Math.max(2, distinctOperators + distinctOperands);

  return Math.max(1, totalTokens * Math.log2(vocabulary));
}
