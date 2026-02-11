export class ClearError extends Error {
  line: number;
  column: number;
  hint?: string;

  constructor(message: string, line: number, column: number, hint?: string) {
    super(message);
    this.name = 'ClearError';
    this.line = line;
    this.column = column;
    this.hint = hint;
  }

  format(source?: string): string {
    let result = `Error on line ${this.line}: ${this.message}`;

    if (source) {
      const lines = source.split('\n');
      const errorLine = lines[this.line - 1];
      if (errorLine) {
        result += '\n\n';
        result += `  ${this.line} | ${errorLine}\n`;
        result += `  ${' '.repeat(String(this.line).length)} | ${' '.repeat(this.column - 1)}^`;
      }
    }

    if (this.hint) {
      result += `\n\nHint: ${this.hint}`;
    }

    return result;
  }
}

export class ParseError extends ClearError {
  constructor(message: string, line: number, column: number, hint?: string) {
    super(message, line, column, hint);
    this.name = 'ParseError';
  }
}

export class RuntimeError extends ClearError {
  constructor(message: string, line: number, column: number = 1, hint?: string) {
    super(message, line, column, hint);
    this.name = 'RuntimeError';
  }
}

// Helper to suggest similar words
export function suggestSimilar(word: string, possibilities: string[]): string | null {
  const lower = word.toLowerCase();

  // Check for exact prefix match
  const prefixMatches = possibilities.filter(p => p.startsWith(lower));
  if (prefixMatches.length === 1) {
    return prefixMatches[0];
  }

  // Simple Levenshtein distance for suggestions
  let bestMatch: string | null = null;
  let bestDistance = Infinity;

  for (const possibility of possibilities) {
    const distance = levenshteinDistance(lower, possibility.toLowerCase());
    if (distance < bestDistance && distance <= 2) {
      bestDistance = distance;
      bestMatch = possibility;
    }
  }

  return bestMatch;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b[i - 1] === a[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}
