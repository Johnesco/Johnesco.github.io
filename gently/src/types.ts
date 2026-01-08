// Token types for the Clear language

export enum TokenType {
  // Keywords
  SET = 'SET',
  TO = 'TO',
  IF = 'IF',
  THEN = 'THEN',
  ELSE = 'ELSE',
  END = 'END',
  FUNCTION = 'FUNCTION',
  TAKING = 'TAKING',
  WITH = 'WITH',
  REPEAT = 'REPEAT',
  TIMES = 'TIMES',
  WHILE = 'WHILE',
  FOR = 'FOR',
  EACH = 'EACH',
  IN = 'IN',
  DO = 'DO',
  RETURN = 'RETURN',
  AND = 'AND',
  OR = 'OR',
  NOT = 'NOT',
  IS = 'IS',
  EQUAL = 'EQUAL',
  GREATER = 'GREATER',
  LESS = 'LESS',
  THAN = 'THAN',
  PLUS = 'PLUS',
  MINUS = 'MINUS',
  TIMES_OP = 'TIMES_OP',
  DIVIDED = 'DIVIDED',
  BY = 'BY',
  MOD = 'MOD',
  JOINED = 'JOINED',
  LIST = 'LIST',
  OF = 'OF',
  ITEM = 'ITEM',
  YES = 'YES',
  NO = 'NO',
  PRINT = 'PRINT',
  DRAW = 'DRAW',
  CIRCLE = 'CIRCLE',
  RECTANGLE = 'RECTANGLE',
  LINE = 'LINE',
  AT = 'AT',
  FROM = 'FROM',
  RADIUS = 'RADIUS',
  WIDTH = 'WIDTH',
  HEIGHT = 'HEIGHT',
  COLOR = 'COLOR',
  CLEAR = 'CLEAR',
  CANVAS = 'CANVAS',

  // Literals
  NUMBER = 'NUMBER',
  STRING = 'STRING',
  IDENTIFIER = 'IDENTIFIER',

  // Symbols
  COMMA = 'COMMA',
  PLUS_SYMBOL = 'PLUS_SYMBOL',
  MINUS_SYMBOL = 'MINUS_SYMBOL',
  STAR = 'STAR',
  SLASH = 'SLASH',
  NEWLINE = 'NEWLINE',
  EOF = 'EOF',
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}

// AST Node types

export type ASTNode =
  | Program
  | Statement
  | Expression;

export interface Program {
  type: 'Program';
  statements: Statement[];
}

export type Statement =
  | SetStatement
  | IfStatement
  | RepeatTimesStatement
  | RepeatWhileStatement
  | ForEachStatement
  | FunctionDeclaration
  | FunctionCallStatement
  | ReturnStatement
  | PrintStatement
  | DrawStatement
  | SetColorStatement
  | ClearCanvasStatement;

export interface SetStatement {
  type: 'SetStatement';
  identifier: string;
  value: Expression;
  line: number;
}

export interface IfStatement {
  type: 'IfStatement';
  condition: Expression;
  thenBranch: Statement[];
  elseBranch: Statement[] | null;
  line: number;
}

export interface RepeatTimesStatement {
  type: 'RepeatTimesStatement';
  count: Expression;
  body: Statement[];
  line: number;
}

export interface RepeatWhileStatement {
  type: 'RepeatWhileStatement';
  condition: Expression;
  body: Statement[];
  line: number;
}

export interface ForEachStatement {
  type: 'ForEachStatement';
  variable: string;
  iterable: Expression;
  body: Statement[];
  line: number;
}

export interface FunctionDeclaration {
  type: 'FunctionDeclaration';
  name: string;
  parameters: string[];
  body: Statement[];
  line: number;
}

export interface FunctionCallStatement {
  type: 'FunctionCallStatement';
  call: FunctionCallExpression;
  line: number;
}

export interface ReturnStatement {
  type: 'ReturnStatement';
  value: Expression | null;
  line: number;
}

export interface PrintStatement {
  type: 'PrintStatement';
  value: Expression;
  line: number;
}

export interface DrawStatement {
  type: 'DrawStatement';
  shape: 'circle' | 'rectangle' | 'line';
  params: Record<string, Expression>;
  line: number;
}

export interface SetColorStatement {
  type: 'SetColorStatement';
  color: Expression;
  line: number;
}

export interface ClearCanvasStatement {
  type: 'ClearCanvasStatement';
  line: number;
}

// Expressions

export type Expression =
  | NumberLiteral
  | StringLiteral
  | BooleanLiteral
  | Identifier
  | ListLiteral
  | ItemAccess
  | BinaryExpression
  | UnaryExpression
  | JoinedExpression
  | FunctionCallExpression
  | ComparisonExpression;

export interface NumberLiteral {
  type: 'NumberLiteral';
  value: number;
}

export interface StringLiteral {
  type: 'StringLiteral';
  value: string;
}

export interface BooleanLiteral {
  type: 'BooleanLiteral';
  value: boolean;
}

export interface Identifier {
  type: 'Identifier';
  name: string;
}

export interface ListLiteral {
  type: 'ListLiteral';
  elements: Expression[];
}

export interface ItemAccess {
  type: 'ItemAccess';
  index: Expression;
  list: Expression;
}

export interface BinaryExpression {
  type: 'BinaryExpression';
  operator: 'plus' | 'minus' | 'times' | 'divided by' | 'mod' | 'and' | 'or';
  left: Expression;
  right: Expression;
}

export interface UnaryExpression {
  type: 'UnaryExpression';
  operator: 'not' | 'minus';
  operand: Expression;
}

export interface JoinedExpression {
  type: 'JoinedExpression';
  left: Expression;
  right: Expression;
}

export interface FunctionCallExpression {
  type: 'FunctionCallExpression';
  name: string;
  arguments: Expression[];
}

export interface ComparisonExpression {
  type: 'ComparisonExpression';
  operator: 'equal to' | 'greater than' | 'less than' | 'greater than or equal to' | 'less than or equal to' | 'not equal to';
  left: Expression;
  right: Expression;
}

// Runtime value types
export type ClearValue =
  | number
  | string
  | boolean
  | ClearValue[]
  | ClearFunction
  | null;

export interface ClearFunction {
  type: 'function';
  name: string;
  parameters: string[];
  body: Statement[];
}
