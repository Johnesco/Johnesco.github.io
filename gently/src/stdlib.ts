import { InterpreterCallbacks } from './interpreter';

export function createCanvasCallbacks(
  canvas: HTMLCanvasElement,
  outputElement: HTMLElement
): InterpreterCallbacks {
  const ctx = canvas.getContext('2d')!;
  let currentColor = 'black';

  return {
    print(value: string): void {
      const line = document.createElement('div');
      line.textContent = value;
      outputElement.appendChild(line);
      outputElement.scrollTop = outputElement.scrollHeight;
    },

    drawCircle(x: number, y: number, radius: number): void {
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = currentColor;
      ctx.fill();
    },

    drawRectangle(x: number, y: number, width: number, height: number): void {
      ctx.fillStyle = currentColor;
      ctx.fillRect(x, y, width, height);
    },

    drawLine(x1: number, y1: number, x2: number, y2: number): void {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    },

    setColor(color: string): void {
      currentColor = color;
    },

    clearCanvas(): void {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    },
  };
}

export function createConsoleCallbacks(): InterpreterCallbacks {
  return {
    print(value: string): void {
      console.log(value);
    },

    drawCircle(x: number, y: number, radius: number): void {
      console.log(`[Draw circle at (${x}, ${y}) with radius ${radius}]`);
    },

    drawRectangle(x: number, y: number, width: number, height: number): void {
      console.log(`[Draw rectangle at (${x}, ${y}) with size ${width}x${height}]`);
    },

    drawLine(x1: number, y1: number, x2: number, y2: number): void {
      console.log(`[Draw line from (${x1}, ${y1}) to (${x2}, ${y2})]`);
    },

    setColor(color: string): void {
      console.log(`[Set color to ${color}]`);
    },

    clearCanvas(): void {
      console.log('[Clear canvas]');
    },
  };
}
