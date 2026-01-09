import { Token, TokenType } from './types';
import { ClearError } from './errors';

const KEYWORDS: Record<string, TokenType> = {
  'set': TokenType.SET,
  'to': TokenType.TO,
  'if': TokenType.IF,
  'then': TokenType.THEN,
  'else': TokenType.ELSE,
  'end': TokenType.END,
  'function': TokenType.FUNCTION,
  'taking': TokenType.TAKING,
  'with': TokenType.WITH,
  'repeat': TokenType.REPEAT,
  'times': TokenType.TIMES,
  'while': TokenType.WHILE,
  'for': TokenType.FOR,
  'each': TokenType.EACH,
  'in': TokenType.IN,
  'do': TokenType.DO,
  'return': TokenType.RETURN,
  'and': TokenType.AND,
  'or': TokenType.OR,
  'not': TokenType.NOT,
  'is': TokenType.IS,
  'equal': TokenType.EQUAL,
  'greater': TokenType.GREATER,
  'less': TokenType.LESS,
  'than': TokenType.THAN,
  'plus': TokenType.PLUS,
  'minus': TokenType.MINUS,
  'divided': TokenType.DIVIDED,
  'by': TokenType.BY,
  'mod': TokenType.MOD,
  'joined': TokenType.JOINED,
  'list': TokenType.LIST,
  'of': TokenType.OF,
  'item': TokenType.ITEM,
  'yes': TokenType.YES,
  'no': TokenType.NO,
  'print': TokenType.PRINT,
  'draw': TokenType.DRAW,
  'circle': TokenType.CIRCLE,
  'rectangle': TokenType.RECTANGLE,
  'line': TokenType.LINE,
  'at': TokenType.AT,
  'from': TokenType.FROM,
  'radius': TokenType.RADIUS,
  'width': TokenType.WIDTH,
  'height': TokenType.HEIGHT,
  'color': TokenType.COLOR,
  'clear': TokenType.CLEAR,
  'canvas': TokenType.CANVAS,
  'length': TokenType.LENGTH,
  'ask': TokenType.ASK,
  'store': TokenType.STORE,
  'random': TokenType.RANDOM,
  'number': TokenType.NUMBER_KW,
};

export class Lexer {
  private source: string;
  private tokens: Token[] = [];
  private start = 0;
  private current = 0;
  private line = 1;
  private column = 1;
  private lineStart = 0;

  constructor(source: string) {
    this.source = source;
  }

  tokenize(): Token[] {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push({
      type: TokenType.EOF,
      value: '',
      line: this.line,
      column: this.column,
    });

    return this.tokens;
  }

  private scanToken(): void {
    const char = this.advance();

    switch (char) {
      case ' ':
      case '\r':
      case '\t':
        // Ignore whitespace
        break;

      case '\n':
        this.addToken(TokenType.NEWLINE, '\\n');
        this.line++;
        this.lineStart = this.current;
        this.column = 1;
        break;

      case ',':
        this.addToken(TokenType.COMMA, ',');
        break;

      case '+':
        this.addToken(TokenType.PLUS_SYMBOL, '+');
        break;

      case '-':
        this.addToken(TokenType.MINUS_SYMBOL, '-');
        break;

      case '*':
        this.addToken(TokenType.STAR, '*');
        break;

      case '/':
        this.addToken(TokenType.SLASH, '/');
        break;

      case '(':
        this.addToken(TokenType.LEFT_PAREN, '(');
        break;

      case ')':
        this.addToken(TokenType.RIGHT_PAREN, ')');
        break;

      case '"':
        this.string();
        break;

      default:
        if (this.isDigit(char)) {
          this.number();
        } else if (this.isAlpha(char)) {
          this.identifier();
        } else {
          throw new ClearError(
            `I don't recognize the character '${char}'`,
            this.line,
            this.column - 1
          );
        }
    }
  }

  private string(): void {
    const startLine = this.line;
    const startColumn = this.column - 1;

    while (this.peek() !== '"' && !this.isAtEnd()) {
      if (this.peek() === '\n') {
        this.line++;
        this.column = 1;
      }
      this.advance();
    }

    if (this.isAtEnd()) {
      throw new ClearError(
        'I found a string that was never closed. Add a " at the end.',
        startLine,
        startColumn
      );
    }

    // Closing "
    this.advance();

    // Get the string value without quotes
    const value = this.source.slice(this.start + 1, this.current - 1);
    this.addToken(TokenType.STRING, value);
  }

  private number(): void {
    while (this.isDigit(this.peek())) {
      this.advance();
    }

    // Look for decimal part
    if (this.peek() === '.' && this.isDigit(this.peekNext())) {
      this.advance(); // consume the '.'
      while (this.isDigit(this.peek())) {
        this.advance();
      }
    }

    const value = this.source.slice(this.start, this.current);
    this.addToken(TokenType.NUMBER, value);
  }

  private identifier(): void {
    while (this.isAlphaNumeric(this.peek())) {
      this.advance();
    }

    const text = this.source.slice(this.start, this.current).toLowerCase();

    // Check for "note:" comment
    if (text === 'note' && this.peek() === ':') {
      this.advance(); // consume ':'
      // Skip to end of line
      while (this.peek() !== '\n' && !this.isAtEnd()) {
        this.advance();
      }
      return; // Don't add a token for comments
    }

    const tokenType = KEYWORDS[text] ?? TokenType.IDENTIFIER;
    this.addToken(tokenType, text);
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private advance(): string {
    this.column++;
    return this.source[this.current++];
  }

  private peek(): string {
    if (this.isAtEnd()) return '\0';
    return this.source[this.current];
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return '\0';
    return this.source[this.current + 1];
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isAlpha(char: string): boolean {
    return (
      (char >= 'a' && char <= 'z') ||
      (char >= 'A' && char <= 'Z') ||
      char === '_'
    );
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }

  private addToken(type: TokenType, value: string): void {
    this.tokens.push({
      type,
      value,
      line: this.line,
      column: this.column - value.length,
    });
  }
}

export function tokenize(source: string): Token[] {
  const lexer = new Lexer(source);
  return lexer.tokenize();
}
