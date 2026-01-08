import {
  Program,
  Statement,
  Expression,
  ClearValue,
  ClearFunction,
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
  BinaryExpression,
  UnaryExpression,
  ComparisonExpression,
  JoinedExpression,
  FunctionCallExpression,
  ItemAccess,
} from './types';
import { RuntimeError } from './errors';

export interface InterpreterCallbacks {
  print: (value: string) => void;
  drawCircle: (x: number, y: number, radius: number) => void;
  drawRectangle: (x: number, y: number, width: number, height: number) => void;
  drawLine: (x1: number, y1: number, x2: number, y2: number) => void;
  setColor: (color: string) => void;
  clearCanvas: () => void;
}

class ReturnValue {
  value: ClearValue;
  constructor(value: ClearValue) {
    this.value = value;
  }
}

export class Interpreter {
  private globals: Map<string, ClearValue> = new Map();
  private environment: Map<string, ClearValue> = this.globals;
  private callbacks: InterpreterCallbacks;

  constructor(callbacks: InterpreterCallbacks) {
    this.callbacks = callbacks;
  }

  run(program: Program): void {
    for (const statement of program.statements) {
      this.executeStatement(statement);
    }
  }

  private executeStatement(statement: Statement): void {
    switch (statement.type) {
      case 'SetStatement':
        this.executeSetStatement(statement);
        break;
      case 'IfStatement':
        this.executeIfStatement(statement);
        break;
      case 'RepeatTimesStatement':
        this.executeRepeatTimesStatement(statement);
        break;
      case 'RepeatWhileStatement':
        this.executeRepeatWhileStatement(statement);
        break;
      case 'ForEachStatement':
        this.executeForEachStatement(statement);
        break;
      case 'FunctionDeclaration':
        this.executeFunctionDeclaration(statement);
        break;
      case 'FunctionCallStatement':
        this.evaluateFunctionCall(statement.call);
        break;
      case 'ReturnStatement':
        this.executeReturnStatement(statement);
        break;
      case 'PrintStatement':
        this.executePrintStatement(statement);
        break;
      case 'DrawStatement':
        this.executeDrawStatement(statement);
        break;
      case 'SetColorStatement':
        this.executeSetColorStatement(statement);
        break;
      case 'ClearCanvasStatement':
        this.callbacks.clearCanvas();
        break;
      default:
        throw new RuntimeError(
          `Unknown statement type: ${(statement as Statement).type}`,
          0
        );
    }
  }

  private executeSetStatement(statement: SetStatement): void {
    const value = this.evaluate(statement.value);
    this.environment.set(statement.identifier, value);
  }

  private executeIfStatement(statement: IfStatement): void {
    const condition = this.evaluate(statement.condition);

    if (this.isTruthy(condition)) {
      for (const stmt of statement.thenBranch) {
        this.executeStatement(stmt);
      }
    } else if (statement.elseBranch) {
      for (const stmt of statement.elseBranch) {
        this.executeStatement(stmt);
      }
    }
  }

  private executeRepeatTimesStatement(statement: RepeatTimesStatement): void {
    const count = this.evaluate(statement.count);

    if (typeof count !== 'number') {
      throw new RuntimeError(
        `'repeat' needs a number, but got ${typeof count}`,
        statement.line
      );
    }

    for (let i = 0; i < count; i++) {
      for (const stmt of statement.body) {
        this.executeStatement(stmt);
      }
    }
  }

  private executeRepeatWhileStatement(statement: RepeatWhileStatement): void {
    let iterations = 0;
    const maxIterations = 100000; // Prevent infinite loops

    while (this.isTruthy(this.evaluate(statement.condition))) {
      for (const stmt of statement.body) {
        this.executeStatement(stmt);
      }

      iterations++;
      if (iterations > maxIterations) {
        throw new RuntimeError(
          'This loop has run too many times. There might be an infinite loop.',
          statement.line,
          1,
          'Check that your loop condition will eventually become false'
        );
      }
    }
  }

  private executeForEachStatement(statement: ForEachStatement): void {
    const iterable = this.evaluate(statement.iterable);

    if (!Array.isArray(iterable)) {
      throw new RuntimeError(
        `'for each' needs a list to loop over, but got ${typeof iterable}`,
        statement.line
      );
    }

    const previousEnv = this.environment;
    this.environment = new Map(previousEnv);

    for (const item of iterable) {
      this.environment.set(statement.variable, item);
      for (const stmt of statement.body) {
        this.executeStatement(stmt);
      }
    }

    this.environment = previousEnv;
  }

  private executeFunctionDeclaration(statement: FunctionDeclaration): void {
    const func: ClearFunction = {
      type: 'function',
      name: statement.name,
      parameters: statement.parameters,
      body: statement.body,
    };
    this.globals.set(statement.name, func);
  }

  private executeReturnStatement(statement: ReturnStatement): void {
    const value = statement.value ? this.evaluate(statement.value) : null;
    throw new ReturnValue(value);
  }

  private executePrintStatement(statement: PrintStatement): void {
    const value = this.evaluate(statement.value);
    this.callbacks.print(this.stringify(value));
  }

  private executeDrawStatement(statement: DrawStatement): void {
    const params = statement.params;

    switch (statement.shape) {
      case 'circle': {
        const x = this.evaluateNumber(params.x, 'x', statement.line);
        const y = this.evaluateNumber(params.y, 'y', statement.line);
        const radius = this.evaluateNumber(params.radius, 'radius', statement.line);
        this.callbacks.drawCircle(x, y, radius);
        break;
      }
      case 'rectangle': {
        const x = this.evaluateNumber(params.x, 'x', statement.line);
        const y = this.evaluateNumber(params.y, 'y', statement.line);
        const width = this.evaluateNumber(params.width, 'width', statement.line);
        const height = this.evaluateNumber(params.height, 'height', statement.line);
        this.callbacks.drawRectangle(x, y, width, height);
        break;
      }
      case 'line': {
        const x1 = this.evaluateNumber(params.x1, 'x1', statement.line);
        const y1 = this.evaluateNumber(params.y1, 'y1', statement.line);
        const x2 = this.evaluateNumber(params.x2, 'x2', statement.line);
        const y2 = this.evaluateNumber(params.y2, 'y2', statement.line);
        this.callbacks.drawLine(x1, y1, x2, y2);
        break;
      }
    }
  }

  private executeSetColorStatement(statement: SetColorStatement): void {
    const color = this.evaluate(statement.color);
    this.callbacks.setColor(String(color));
  }

  private evaluate(expression: Expression): ClearValue {
    switch (expression.type) {
      case 'NumberLiteral':
        return expression.value;

      case 'StringLiteral':
        return expression.value;

      case 'BooleanLiteral':
        return expression.value;

      case 'Identifier':
        return this.lookupVariable(expression.name);

      case 'ListLiteral':
        return expression.elements.map(e => this.evaluate(e));

      case 'ItemAccess':
        return this.evaluateItemAccess(expression);

      case 'BinaryExpression':
        return this.evaluateBinaryExpression(expression);

      case 'UnaryExpression':
        return this.evaluateUnaryExpression(expression);

      case 'ComparisonExpression':
        return this.evaluateComparisonExpression(expression);

      case 'JoinedExpression':
        return this.evaluateJoinedExpression(expression);

      case 'FunctionCallExpression':
        return this.evaluateFunctionCall(expression);

      default:
        throw new RuntimeError(
          `Unknown expression type: ${(expression as Expression).type}`,
          0
        );
    }
  }

  private lookupVariable(name: string): ClearValue {
    if (this.environment.has(name)) {
      return this.environment.get(name)!;
    }
    if (this.globals.has(name)) {
      return this.globals.get(name)!;
    }
    throw new RuntimeError(
      `I don't know what '${name}' is. Did you forget to set it first?`,
      0,
      1,
      `Try adding: set ${name} to ...`
    );
  }

  private evaluateItemAccess(expression: ItemAccess): ClearValue {
    const index = this.evaluate(expression.index);
    const list = this.evaluate(expression.list);

    if (typeof index !== 'number') {
      throw new RuntimeError(
        `The item number needs to be a number, but got ${typeof index}`,
        0
      );
    }

    if (!Array.isArray(list)) {
      throw new RuntimeError(
        `'item' can only be used with lists, but got ${typeof list}`,
        0
      );
    }

    // 1-indexed
    const i = Math.floor(index) - 1;

    if (i < 0 || i >= list.length) {
      throw new RuntimeError(
        `There is no item ${index} in this list. The list has ${list.length} item(s).`,
        0,
        1,
        `Valid item numbers are 1 to ${list.length}`
      );
    }

    return list[i];
  }

  private evaluateBinaryExpression(expression: BinaryExpression): ClearValue {
    const left = this.evaluate(expression.left);
    const right = this.evaluate(expression.right);

    switch (expression.operator) {
      case 'plus':
        if (typeof left === 'number' && typeof right === 'number') {
          return left + right;
        }
        throw new RuntimeError(
          `Cannot add ${typeof left} and ${typeof right}. Both sides need to be numbers.`,
          0
        );

      case 'minus':
        if (typeof left === 'number' && typeof right === 'number') {
          return left - right;
        }
        throw new RuntimeError(
          `Cannot subtract ${typeof left} and ${typeof right}. Both sides need to be numbers.`,
          0
        );

      case 'times':
        if (typeof left === 'number' && typeof right === 'number') {
          return left * right;
        }
        throw new RuntimeError(
          `Cannot multiply ${typeof left} and ${typeof right}. Both sides need to be numbers.`,
          0
        );

      case 'divided by':
        if (typeof left === 'number' && typeof right === 'number') {
          if (right === 0) {
            throw new RuntimeError(
              'Cannot divide by zero',
              0,
              1,
              'Division by zero is undefined in mathematics'
            );
          }
          return left / right;
        }
        throw new RuntimeError(
          `Cannot divide ${typeof left} by ${typeof right}. Both sides need to be numbers.`,
          0
        );

      case 'mod':
        if (typeof left === 'number' && typeof right === 'number') {
          return left % right;
        }
        throw new RuntimeError(
          `Cannot use 'mod' with ${typeof left} and ${typeof right}. Both sides need to be numbers.`,
          0
        );

      case 'and':
        return this.isTruthy(left) && this.isTruthy(right);

      case 'or':
        return this.isTruthy(left) || this.isTruthy(right);

      default:
        throw new RuntimeError(`Unknown operator: ${expression.operator}`, 0);
    }
  }

  private evaluateUnaryExpression(expression: UnaryExpression): ClearValue {
    const operand = this.evaluate(expression.operand);

    switch (expression.operator) {
      case 'not':
        return !this.isTruthy(operand);

      case 'minus':
        if (typeof operand === 'number') {
          return -operand;
        }
        throw new RuntimeError(
          `Cannot negate ${typeof operand}. Expected a number.`,
          0
        );

      default:
        throw new RuntimeError(`Unknown operator: ${expression.operator}`, 0);
    }
  }

  private evaluateComparisonExpression(expression: ComparisonExpression): ClearValue {
    const left = this.evaluate(expression.left);
    const right = this.evaluate(expression.right);

    switch (expression.operator) {
      case 'equal to':
        return this.isEqual(left, right);

      case 'not equal to':
        return !this.isEqual(left, right);

      case 'greater than':
        if (typeof left === 'number' && typeof right === 'number') {
          return left > right;
        }
        throw new RuntimeError(
          `Cannot compare ${typeof left} and ${typeof right}. Both sides need to be numbers.`,
          0
        );

      case 'less than':
        if (typeof left === 'number' && typeof right === 'number') {
          return left < right;
        }
        throw new RuntimeError(
          `Cannot compare ${typeof left} and ${typeof right}. Both sides need to be numbers.`,
          0
        );

      case 'greater than or equal to':
        if (typeof left === 'number' && typeof right === 'number') {
          return left >= right;
        }
        throw new RuntimeError(
          `Cannot compare ${typeof left} and ${typeof right}. Both sides need to be numbers.`,
          0
        );

      case 'less than or equal to':
        if (typeof left === 'number' && typeof right === 'number') {
          return left <= right;
        }
        throw new RuntimeError(
          `Cannot compare ${typeof left} and ${typeof right}. Both sides need to be numbers.`,
          0
        );

      default:
        throw new RuntimeError(`Unknown comparison: ${expression.operator}`, 0);
    }
  }

  private evaluateJoinedExpression(expression: JoinedExpression): ClearValue {
    const left = this.evaluate(expression.left);
    const right = this.evaluate(expression.right);
    return this.stringify(left) + this.stringify(right);
  }

  private evaluateFunctionCall(expression: FunctionCallExpression): ClearValue {
    const func = this.lookupVariable(expression.name);

    if (!func || typeof func !== 'object' || (func as ClearFunction).type !== 'function') {
      throw new RuntimeError(
        `'${expression.name}' is not a function`,
        0,
        1,
        `Make sure you defined a function called '${expression.name}'`
      );
    }

    const clearFunc = func as ClearFunction;
    const args = expression.arguments.map(arg => this.evaluate(arg));

    if (args.length !== clearFunc.parameters.length) {
      throw new RuntimeError(
        `The function '${expression.name}' needs ${clearFunc.parameters.length} value(s), but you gave it ${args.length}`,
        0
      );
    }

    // Create new environment for function
    const previousEnv = this.environment;
    this.environment = new Map(this.globals);

    // Bind parameters
    for (let i = 0; i < clearFunc.parameters.length; i++) {
      this.environment.set(clearFunc.parameters[i], args[i]);
    }

    let result: ClearValue = null;

    try {
      for (const stmt of clearFunc.body) {
        this.executeStatement(stmt);
      }
    } catch (e) {
      if (e instanceof ReturnValue) {
        result = e.value;
      } else {
        throw e;
      }
    }

    this.environment = previousEnv;
    return result;
  }

  private evaluateNumber(expression: Expression, name: string, line: number): number {
    const value = this.evaluate(expression);
    if (typeof value !== 'number') {
      throw new RuntimeError(
        `'${name}' needs to be a number, but got ${typeof value}`,
        line
      );
    }
    return value;
  }

  private isTruthy(value: ClearValue): boolean {
    if (value === null) return false;
    if (typeof value === 'boolean') return value;
    return true;
  }

  private isEqual(a: ClearValue, b: ClearValue): boolean {
    if (a === null && b === null) return true;
    if (a === null || b === null) return false;
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, i) => this.isEqual(item, b[i]));
    }
    return a === b;
  }

  private stringify(value: ClearValue): string {
    if (value === null) return 'nothing';
    if (typeof value === 'boolean') return value ? 'yes' : 'no';
    if (Array.isArray(value)) {
      return 'list of ' + value.map(v => this.stringify(v)).join(', ');
    }
    if (typeof value === 'object' && (value as ClearFunction).type === 'function') {
      return `function ${(value as ClearFunction).name}`;
    }
    return String(value);
  }
}

export function createInterpreter(callbacks: InterpreterCallbacks): Interpreter {
  return new Interpreter(callbacks);
}
