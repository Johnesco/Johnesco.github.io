// Main entry point for the Clear language

export { tokenize, Lexer } from './lexer';
export { parse, Parser } from './parser';
export { createInterpreter, Interpreter } from './interpreter';
export { createCanvasCallbacks, createConsoleCallbacks } from './stdlib';
export { ClearError, ParseError, RuntimeError } from './errors';
export * from './types';

import { tokenize } from './lexer';
import { parse } from './parser';
import { createInterpreter, InterpreterCallbacks } from './interpreter';
import { ClearError } from './errors';

export interface RunResult {
  success: boolean;
  error?: {
    message: string;
    line: number;
    column: number;
    formatted: string;
  };
}

export async function run(source: string, callbacks: InterpreterCallbacks): Promise<RunResult> {
  try {
    const tokens = tokenize(source);
    const program = parse(tokens);
    const interpreter = createInterpreter(callbacks);
    await interpreter.run(program);
    return { success: true };
  } catch (error) {
    if (error instanceof ClearError) {
      return {
        success: false,
        error: {
          message: error.message,
          line: error.line,
          column: error.column,
          formatted: error.format(source),
        },
      };
    }
    throw error;
  }
}
