import {
  Token,
  TokenType,
  Program,
  Statement,
  Expression,
  SetStatement,
  IfStatement,
  RepeatTimesStatement,
  RepeatWhileStatement,
  ForEachStatement,
  FunctionDeclaration,
  FunctionCallStatement,
  ReturnStatement,
  PrintStatement,
  DrawStatement,
  SetColorStatement,
  ClearCanvasStatement,
  NumberLiteral,
  StringLiteral,
  BooleanLiteral,
  Identifier,
  ListLiteral,
  ItemAccess,
  BinaryExpression,
  JoinedExpression,
  FunctionCallExpression,
  ComparisonExpression,
  UnaryExpression,
} from './types';
import { ParseError, suggestSimilar } from './errors';

export class Parser {
  private tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    // Filter out newlines for easier parsing, but keep track of lines via tokens
    this.tokens = tokens.filter(t => t.type !== TokenType.NEWLINE);
  }

  parse(): Program {
    const statements: Statement[] = [];

    while (!this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) {
        statements.push(stmt);
      }
    }

    return { type: 'Program', statements };
  }

  private parseStatement(): Statement | null {
    // Skip any extra newlines
    while (this.check(TokenType.NEWLINE)) {
      this.advance();
    }

    if (this.isAtEnd()) return null;

    if (this.check(TokenType.SET)) {
      return this.parseSetStatement();
    }

    if (this.check(TokenType.IF)) {
      return this.parseIfStatement();
    }

    if (this.check(TokenType.REPEAT)) {
      return this.parseRepeatStatement();
    }

    if (this.check(TokenType.FOR)) {
      return this.parseForEachStatement();
    }

    if (this.check(TokenType.FUNCTION)) {
      return this.parseFunctionDeclaration();
    }

    if (this.check(TokenType.RETURN)) {
      return this.parseReturnStatement();
    }

    if (this.check(TokenType.PRINT)) {
      return this.parsePrintStatement();
    }

    if (this.check(TokenType.DRAW)) {
      return this.parseDrawStatement();
    }

    if (this.check(TokenType.CLEAR)) {
      return this.parseClearCanvasStatement();
    }

    // Check for function call (identifier followed by 'with')
    if (this.check(TokenType.IDENTIFIER)) {
      const next = this.peekNext();
      if (next && next.type === TokenType.WITH) {
        return this.parseFunctionCallStatement();
      }
      // Standalone identifier - might be a function call without arguments
      return this.parseFunctionCallStatement();
    }

    const token = this.peek();
    throw new ParseError(
      `I don't know how to handle '${token.value}' here`,
      token.line,
      token.column,
      'Statements usually start with: set, if, repeat, for, function, print, or draw'
    );
  }

  private parseSetStatement(): SetStatement | SetColorStatement {
    const setToken = this.consume(TokenType.SET, "Expected 'set'");

    // Check for "set color to" (drawing command)
    if (this.check(TokenType.COLOR)) {
      this.advance();
      this.consume(TokenType.TO, "Expected 'to' after 'set color'");
      const color = this.parseExpression();
      return {
        type: 'SetColorStatement',
        color,
        line: setToken.line,
      };
    }

    const identifier = this.consume(
      TokenType.IDENTIFIER,
      "Expected a variable name after 'set'"
    );

    this.consume(TokenType.TO, `Expected 'to' after 'set ${identifier.value}'`);

    const value = this.parseExpression();

    return {
      type: 'SetStatement',
      identifier: identifier.value,
      value,
      line: setToken.line,
    };
  }

  private parseIfStatement(): IfStatement {
    const ifToken = this.consume(TokenType.IF, "Expected 'if'");

    const condition = this.parseExpression();

    this.consume(TokenType.THEN, "Expected 'then' after the condition");

    const thenBranch: Statement[] = [];
    while (!this.check(TokenType.END) && !this.check(TokenType.ELSE) && !this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) thenBranch.push(stmt);
    }

    let elseBranch: Statement[] | null = null;
    if (this.check(TokenType.ELSE)) {
      this.advance();
      elseBranch = [];
      while (!this.check(TokenType.END) && !this.isAtEnd()) {
        const stmt = this.parseStatement();
        if (stmt) elseBranch.push(stmt);
      }
    }

    this.consume(TokenType.END, "Expected 'end' to close the if statement");
    this.consume(TokenType.IF, "Expected 'if' after 'end' (write 'end if')");

    return {
      type: 'IfStatement',
      condition,
      thenBranch,
      elseBranch,
      line: ifToken.line,
    };
  }

  private parseRepeatStatement(): RepeatTimesStatement | RepeatWhileStatement {
    const repeatToken = this.consume(TokenType.REPEAT, "Expected 'repeat'");

    if (this.check(TokenType.WHILE)) {
      this.advance();
      const condition = this.parseExpression();

      const body: Statement[] = [];
      while (!this.check(TokenType.END) && !this.isAtEnd()) {
        const stmt = this.parseStatement();
        if (stmt) body.push(stmt);
      }

      this.consume(TokenType.END, "Expected 'end' to close the repeat loop");
      this.consume(TokenType.REPEAT, "Expected 'repeat' after 'end' (write 'end repeat')");

      return {
        type: 'RepeatWhileStatement',
        condition,
        body,
        line: repeatToken.line,
      };
    }

    // repeat N times
    const count = this.parseExpression();
    this.consume(TokenType.TIMES, "Expected 'times' after the number");

    const body: Statement[] = [];
    while (!this.check(TokenType.END) && !this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) body.push(stmt);
    }

    this.consume(TokenType.END, "Expected 'end' to close the repeat loop");
    this.consume(TokenType.REPEAT, "Expected 'repeat' after 'end' (write 'end repeat')");

    return {
      type: 'RepeatTimesStatement',
      count,
      body,
      line: repeatToken.line,
    };
  }

  private parseForEachStatement(): ForEachStatement {
    const forToken = this.consume(TokenType.FOR, "Expected 'for'");
    this.consume(TokenType.EACH, "Expected 'each' after 'for'");

    const variable = this.consume(
      TokenType.IDENTIFIER,
      "Expected a variable name after 'for each'"
    );

    this.consume(TokenType.IN, `Expected 'in' after 'for each ${variable.value}'`);

    const iterable = this.parseExpression();

    this.consume(TokenType.DO, "Expected 'do' before the loop body");

    const body: Statement[] = [];
    while (!this.check(TokenType.END) && !this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) body.push(stmt);
    }

    this.consume(TokenType.END, "Expected 'end' to close the for loop");
    this.consume(TokenType.FOR, "Expected 'for' after 'end' (write 'end for')");

    return {
      type: 'ForEachStatement',
      variable: variable.value,
      iterable,
      body,
      line: forToken.line,
    };
  }

  private parseFunctionDeclaration(): FunctionDeclaration {
    const funcToken = this.consume(TokenType.FUNCTION, "Expected 'function'");

    const name = this.consume(
      TokenType.IDENTIFIER,
      "Expected a function name after 'function'"
    );

    const parameters: string[] = [];

    if (this.check(TokenType.TAKING)) {
      this.advance();

      // Parse parameters: taking a b c  OR  taking a, b, c  OR  taking a, b, and c
      while (this.check(TokenType.IDENTIFIER)) {
        parameters.push(this.advance().value);

        // Skip optional comma or 'and'
        if (this.check(TokenType.COMMA)) {
          this.advance();
        }
        if (this.check(TokenType.AND)) {
          this.advance();
        }
      }
    }

    const body: Statement[] = [];
    while (!this.check(TokenType.END) && !this.isAtEnd()) {
      const stmt = this.parseStatement();
      if (stmt) body.push(stmt);
    }

    this.consume(TokenType.END, "Expected 'end' to close the function");
    this.consume(TokenType.FUNCTION, "Expected 'function' after 'end' (write 'end function')");

    return {
      type: 'FunctionDeclaration',
      name: name.value,
      parameters,
      body,
      line: funcToken.line,
    };
  }

  private parseFunctionCallStatement(): FunctionCallStatement {
    const call = this.parseFunctionCallExpression();
    return {
      type: 'FunctionCallStatement',
      call,
      line: call.arguments.length > 0 ? this.previous().line : this.peek().line,
    };
  }

  private parseFunctionCallExpression(): FunctionCallExpression {
    const name = this.consume(TokenType.IDENTIFIER, "Expected function name");
    const args: Expression[] = [];

    if (this.check(TokenType.WITH)) {
      this.advance();

      // Parse arguments: with a b c  OR  with a, b, c  OR  with a, b, and c
      do {
        args.push(this.parseExpression());

        if (this.check(TokenType.COMMA)) {
          this.advance();
        }
        if (this.check(TokenType.AND)) {
          this.advance();
        }
      } while (
        !this.isAtEnd() &&
        !this.checkStatementStart() &&
        !this.check(TokenType.END) &&
        !this.check(TokenType.ELSE) &&
        !this.check(TokenType.THEN)
      );
    }

    return {
      type: 'FunctionCallExpression',
      name: name.value,
      arguments: args,
    };
  }

  private parseReturnStatement(): ReturnStatement {
    const returnToken = this.consume(TokenType.RETURN, "Expected 'return'");

    let value: Expression | null = null;
    if (!this.checkStatementStart() && !this.check(TokenType.END)) {
      value = this.parseExpression();
    }

    return {
      type: 'ReturnStatement',
      value,
      line: returnToken.line,
    };
  }

  private parsePrintStatement(): PrintStatement {
    const printToken = this.consume(TokenType.PRINT, "Expected 'print'");
    const value = this.parseExpression();

    return {
      type: 'PrintStatement',
      value,
      line: printToken.line,
    };
  }

  private parseDrawStatement(): DrawStatement {
    const drawToken = this.consume(TokenType.DRAW, "Expected 'draw'");
    const params: Record<string, Expression> = {};

    if (this.check(TokenType.CIRCLE)) {
      this.advance();
      this.consume(TokenType.AT, "Expected 'at' after 'draw circle'");
      params.x = this.parseExpression();
      this.consumeOptionalComma();
      params.y = this.parseExpression();
      this.consume(TokenType.WITH, "Expected 'with' before radius");
      this.consume(TokenType.RADIUS, "Expected 'radius'");
      params.radius = this.parseExpression();

      return { type: 'DrawStatement', shape: 'circle', params, line: drawToken.line };
    }

    if (this.check(TokenType.RECTANGLE)) {
      this.advance();
      this.consume(TokenType.AT, "Expected 'at' after 'draw rectangle'");
      params.x = this.parseExpression();
      this.consumeOptionalComma();
      params.y = this.parseExpression();
      this.consume(TokenType.WITH, "Expected 'with' before dimensions");
      this.consume(TokenType.WIDTH, "Expected 'width'");
      params.width = this.parseExpression();
      if (this.check(TokenType.AND)) this.advance();
      this.consume(TokenType.HEIGHT, "Expected 'height'");
      params.height = this.parseExpression();

      return { type: 'DrawStatement', shape: 'rectangle', params, line: drawToken.line };
    }

    if (this.check(TokenType.LINE)) {
      this.advance();
      this.consume(TokenType.FROM, "Expected 'from' after 'draw line'");
      params.x1 = this.parseExpression();
      this.consumeOptionalComma();
      params.y1 = this.parseExpression();
      this.consume(TokenType.TO, "Expected 'to' in 'draw line from x1, y1 to x2, y2'");
      params.x2 = this.parseExpression();
      this.consumeOptionalComma();
      params.y2 = this.parseExpression();

      return { type: 'DrawStatement', shape: 'line', params, line: drawToken.line };
    }

    throw new ParseError(
      "Expected 'circle', 'rectangle', or 'line' after 'draw'",
      drawToken.line,
      drawToken.column
    );
  }

  private parseClearCanvasStatement(): ClearCanvasStatement {
    const clearToken = this.consume(TokenType.CLEAR, "Expected 'clear'");
    this.consume(TokenType.CANVAS, "Expected 'canvas' after 'clear'");

    return {
      type: 'ClearCanvasStatement',
      line: clearToken.line,
    };
  }

  // Expression parsing with precedence

  private parseExpression(): Expression {
    return this.parseOr();
  }

  private parseOr(): Expression {
    let left = this.parseAnd();

    while (this.check(TokenType.OR)) {
      this.advance();
      const right = this.parseAnd();
      left = {
        type: 'BinaryExpression',
        operator: 'or',
        left,
        right,
      };
    }

    return left;
  }

  private parseAnd(): Expression {
    let left = this.parseComparison();

    while (this.check(TokenType.AND)) {
      this.advance();
      const right = this.parseComparison();
      left = {
        type: 'BinaryExpression',
        operator: 'and',
        left,
        right,
      };
    }

    return left;
  }

  private parseComparison(): Expression {
    let left = this.parseJoined();

    // Handle "is equal to", "is greater than", etc.
    if (this.check(TokenType.IS)) {
      this.advance();

      let operator: ComparisonExpression['operator'];

      if (this.check(TokenType.EQUAL)) {
        this.advance();
        this.consume(TokenType.TO, "Expected 'to' after 'is equal'");
        operator = 'equal to';
      } else if (this.check(TokenType.GREATER)) {
        this.advance();
        this.consume(TokenType.THAN, "Expected 'than' after 'is greater'");
        if (this.check(TokenType.OR)) {
          this.advance();
          this.consume(TokenType.EQUAL, "Expected 'equal' after 'or'");
          this.consume(TokenType.TO, "Expected 'to' after 'equal'");
          operator = 'greater than or equal to';
        } else {
          operator = 'greater than';
        }
      } else if (this.check(TokenType.LESS)) {
        this.advance();
        this.consume(TokenType.THAN, "Expected 'than' after 'is less'");
        if (this.check(TokenType.OR)) {
          this.advance();
          this.consume(TokenType.EQUAL, "Expected 'equal' after 'or'");
          this.consume(TokenType.TO, "Expected 'to' after 'equal'");
          operator = 'less than or equal to';
        } else {
          operator = 'less than';
        }
      } else if (this.check(TokenType.NOT)) {
        this.advance();
        this.consume(TokenType.EQUAL, "Expected 'equal' after 'is not'");
        this.consume(TokenType.TO, "Expected 'to' after 'equal'");
        operator = 'not equal to';
      } else if (this.check(TokenType.YES)) {
        // "is yes" means equal to yes
        return {
          type: 'ComparisonExpression',
          operator: 'equal to',
          left,
          right: { type: 'BooleanLiteral', value: true },
        };
      } else if (this.check(TokenType.NO)) {
        // "is no" means equal to no
        return {
          type: 'ComparisonExpression',
          operator: 'equal to',
          left,
          right: { type: 'BooleanLiteral', value: false },
        };
      } else {
        throw new ParseError(
          "Expected 'equal to', 'greater than', 'less than', or 'not equal to' after 'is'",
          this.peek().line,
          this.peek().column
        );
      }

      const right = this.parseJoined();

      return {
        type: 'ComparisonExpression',
        operator,
        left,
        right,
      };
    }

    return left;
  }

  private parseJoined(): Expression {
    let left = this.parseAdditive();

    while (this.check(TokenType.JOINED)) {
      this.advance();
      this.consume(TokenType.WITH, "Expected 'with' after 'joined'");
      const right = this.parseAdditive();
      left = {
        type: 'JoinedExpression',
        left,
        right,
      };
    }

    return left;
  }

  private parseAdditive(): Expression {
    let left = this.parseMultiplicative();

    while (true) {
      let operator: BinaryExpression['operator'] | null = null;

      if (this.check(TokenType.PLUS) || this.check(TokenType.PLUS_SYMBOL)) {
        this.advance();
        operator = 'plus';
      } else if (this.check(TokenType.MINUS) || this.check(TokenType.MINUS_SYMBOL)) {
        this.advance();
        operator = 'minus';
      }

      if (operator) {
        const right = this.parseMultiplicative();
        left = {
          type: 'BinaryExpression',
          operator,
          left,
          right,
        };
      } else {
        break;
      }
    }

    return left;
  }

  private parseMultiplicative(): Expression {
    let left = this.parseUnary();

    while (true) {
      let operator: BinaryExpression['operator'] | null = null;

      if (this.check(TokenType.TIMES_OP) || this.check(TokenType.STAR)) {
        this.advance();
        operator = 'times';
      } else if (this.check(TokenType.TIMES)) {
        // Check it's not "repeat N times"
        this.advance();
        operator = 'times';
      } else if (this.check(TokenType.DIVIDED)) {
        this.advance();
        this.consume(TokenType.BY, "Expected 'by' after 'divided'");
        operator = 'divided by';
      } else if (this.check(TokenType.SLASH)) {
        this.advance();
        operator = 'divided by';
      } else if (this.check(TokenType.MOD)) {
        this.advance();
        operator = 'mod';
      }

      if (operator) {
        const right = this.parseUnary();
        left = {
          type: 'BinaryExpression',
          operator,
          left,
          right,
        };
      } else {
        break;
      }
    }

    return left;
  }

  private parseUnary(): Expression {
    if (this.check(TokenType.NOT)) {
      this.advance();
      const operand = this.parseUnary();
      return {
        type: 'UnaryExpression',
        operator: 'not',
        operand,
      };
    }

    if (this.check(TokenType.MINUS_SYMBOL)) {
      this.advance();
      const operand = this.parseUnary();
      return {
        type: 'UnaryExpression',
        operator: 'minus',
        operand,
      };
    }

    return this.parsePrimary();
  }

  private parsePrimary(): Expression {
    // Number literal
    if (this.check(TokenType.NUMBER)) {
      const token = this.advance();
      return {
        type: 'NumberLiteral',
        value: parseFloat(token.value),
      };
    }

    // String literal
    if (this.check(TokenType.STRING)) {
      const token = this.advance();
      return {
        type: 'StringLiteral',
        value: token.value,
      };
    }

    // Boolean literals
    if (this.check(TokenType.YES)) {
      this.advance();
      return { type: 'BooleanLiteral', value: true };
    }

    if (this.check(TokenType.NO)) {
      this.advance();
      return { type: 'BooleanLiteral', value: false };
    }

    // List literal: list of 1, 2, 3
    if (this.check(TokenType.LIST)) {
      this.advance();
      this.consume(TokenType.OF, "Expected 'of' after 'list'");

      const elements: Expression[] = [];
      do {
        elements.push(this.parseExpression());
        if (this.check(TokenType.COMMA)) {
          this.advance();
        }
        if (this.check(TokenType.AND)) {
          this.advance();
        }
      } while (
        !this.isAtEnd() &&
        !this.checkStatementStart() &&
        !this.check(TokenType.END) &&
        this.check(TokenType.NUMBER) ||
        this.check(TokenType.STRING) ||
        this.check(TokenType.IDENTIFIER) ||
        this.check(TokenType.YES) ||
        this.check(TokenType.NO)
      );

      return { type: 'ListLiteral', elements };
    }

    // Item access: item N of list
    if (this.check(TokenType.ITEM)) {
      this.advance();
      const index = this.parseExpression();
      this.consume(TokenType.OF, "Expected 'of' after item index");
      const list = this.parseExpression();

      return {
        type: 'ItemAccess',
        index,
        list,
      };
    }

    // Identifier or function call
    if (this.check(TokenType.IDENTIFIER)) {
      const name = this.advance();

      // Check if this is a function call with 'with'
      if (this.check(TokenType.WITH)) {
        // Put back the identifier and parse as function call
        this.current--;
        return this.parseFunctionCallExpression();
      }

      return {
        type: 'Identifier',
        name: name.value,
      };
    }

    const token = this.peek();
    throw new ParseError(
      `I expected a value here but found '${token.value}'`,
      token.line,
      token.column
    );
  }

  // Helper methods

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private checkStatementStart(): boolean {
    return (
      this.check(TokenType.SET) ||
      this.check(TokenType.IF) ||
      this.check(TokenType.REPEAT) ||
      this.check(TokenType.FOR) ||
      this.check(TokenType.FUNCTION) ||
      this.check(TokenType.RETURN) ||
      this.check(TokenType.PRINT) ||
      this.check(TokenType.DRAW) ||
      this.check(TokenType.CLEAR)
    );
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private peekNext(): Token | null {
    if (this.current + 1 >= this.tokens.length) return null;
    return this.tokens[this.current + 1];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();

    const token = this.peek();
    const suggestion = suggestSimilar(token.value, [type.toLowerCase()]);
    const hint = suggestion ? `Did you mean '${suggestion}'?` : undefined;

    throw new ParseError(message, token.line, token.column, hint);
  }

  private consumeOptionalComma(): void {
    if (this.check(TokenType.COMMA)) {
      this.advance();
    }
  }
}

export function parse(tokens: Token[]): Program {
  const parser = new Parser(tokens);
  return parser.parse();
}
