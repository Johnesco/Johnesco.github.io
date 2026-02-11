import { run } from '../src/index';

// Syntax highlighting
const KEYWORDS = [
  'set', 'to', 'if', 'then', 'else', 'end', 'function', 'taking', 'with',
  'repeat', 'times', 'while', 'for', 'each', 'in', 'do', 'return',
  'and', 'or', 'not', 'is', 'equal', 'greater', 'less', 'than',
  'plus', 'minus', 'divided', 'by', 'mod', 'joined',
  'list', 'of', 'item', 'length', 'random', 'number', 'from',
  'ask', 'store'
];

const BUILTINS = [
  'print', 'draw', 'circle', 'rectangle', 'line', 'at', 'radius',
  'width', 'height', 'color', 'clear', 'canvas'
];

const BOOLEANS = ['yes', 'no'];

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function highlightCode(code: string): string {
  const lines = code.split('\n');
  const highlightedLines = lines.map(line => {
    // Check for comments first (note:)
    const noteMatch = line.match(/^(\s*)(note:)(.*)$/i);
    if (noteMatch) {
      const [, indent, keyword, rest] = noteMatch;
      return `${escapeHtml(indent)}<span class="hl-comment">${escapeHtml(keyword)}${escapeHtml(rest)}</span>`;
    }

    let result = '';
    let i = 0;

    while (i < line.length) {
      // Check for string
      if (line[i] === '"') {
        let j = i + 1;
        while (j < line.length && line[j] !== '"') {
          j++;
        }
        const str = line.slice(i, j + 1);
        result += `<span class="hl-string">${escapeHtml(str)}</span>`;
        i = j + 1;
        continue;
      }

      // Check for number
      if (/\d/.test(line[i])) {
        let j = i;
        while (j < line.length && /[\d.]/.test(line[j])) {
          j++;
        }
        const num = line.slice(i, j);
        result += `<span class="hl-number">${escapeHtml(num)}</span>`;
        i = j;
        continue;
      }

      // Check for word (keyword, builtin, boolean, identifier)
      if (/[a-zA-Z_]/.test(line[i])) {
        let j = i;
        while (j < line.length && /[a-zA-Z0-9_]/.test(line[j])) {
          j++;
        }
        const word = line.slice(i, j);
        const lowerWord = word.toLowerCase();

        if (BOOLEANS.includes(lowerWord)) {
          result += `<span class="hl-boolean">${escapeHtml(word)}</span>`;
        } else if (KEYWORDS.includes(lowerWord)) {
          result += `<span class="hl-keyword">${escapeHtml(word)}</span>`;
        } else if (BUILTINS.includes(lowerWord)) {
          result += `<span class="hl-builtin">${escapeHtml(word)}</span>`;
        } else {
          result += escapeHtml(word);
        }
        i = j;
        continue;
      }

      // Regular character
      result += escapeHtml(line[i]);
      i++;
    }

    return result;
  });

  return highlightedLines.join('\n');
}

// Example programs
const examples: Record<string, string> = {
  hello: `note: Welcome to Gently!
note: This is a simple Hello World program

print "Hello, World!"
print "Welcome to Gently programming language"

set name to "Friend"
print "Nice to meet you, " joined with name`,

  math: `note: Basic math operations in Gently

set a to 10
set b to 3

print "Math with " joined with a joined with " and " joined with b

set sum to a plus b
print "Sum: " joined with sum

set difference to a minus b
print "Difference: " joined with difference

set product to a times b
print "Product: " joined with product

set quotient to a divided by b
print "Quotient: " joined with quotient

set remainder to a mod b
print "Remainder: " joined with remainder

note: You can also use symbols
set result to 5 + 3 * 2
print "5 + 3 * 2 = " joined with result`,

  loops: `note: Different types of loops in Gently

print "Counting to 5:"
set counter to 1
repeat 5 times
    print counter
    set counter to counter plus 1
end repeat

print ""
print "Using a list:"
set fruits to list of "apple", "banana", "cherry"
for each fruit in fruits do
    print "I like " joined with fruit
end for

print ""
print "Countdown:"
set n to 5
repeat while n is greater than 0
    print n
    set n to n minus 1
end repeat
print "Blast off!"`,

  drawing: `note: Drawing shapes on the canvas
note: Click the "Canvas" tab to see the output!

clear canvas

note: Draw a blue sky
set color to "lightblue"
draw rectangle at 0, 0 with width 400 and height 200

note: Draw the sun
set color to "yellow"
draw circle at 350, 50 with radius 40

note: Draw grass
set color to "green"
draw rectangle at 0, 200 with width 400 and height 100

note: Draw a house
set color to "brown"
draw rectangle at 150, 120 with width 100 and height 80

note: Draw a roof
set color to "darkred"
draw line from 140, 120 to 200, 70
draw line from 200, 70 to 260, 120

note: Draw a door
set color to "saddlebrown"
draw rectangle at 185, 150 with width 30 and height 50

print "Drew a house scene!"
print "Click the Canvas tab to see it."`,

  function: `note: Functions in Gently

note: A simple greeting function
function greet taking name
    print "Hello, " joined with name joined with "!"
end function

greet with "Alice"
greet with "Bob"

note: A function that returns a value
function add taking a b
    return a plus b
end function

set result to add with 5 and 3
print "5 + 3 = " joined with result

note: A function to check if a number is even
function is_even taking number
    set remainder to number mod 2
    if remainder is equal to 0 then
        return yes
    end if
    return no
end function

set num to 4
if is_even with num then
    print num joined with " is even"
else
    print num joined with " is odd"
end if`,

  fibonacci: `note: Fibonacci sequence
note: Tests: recursion, functions returning values, conditionals

function fib taking n
    if n is less than or equal to 1 then
        return n
    end if
    set a to fib with n minus 1
    set b to fib with n minus 2
    return a plus b
end function

print "Fibonacci sequence:"
set i to 0
repeat 10 times
    set result to fib with i
    print "fib(" joined with i joined with ") = " joined with result
    set i to i plus 1
end repeat`,

  fizzbuzz: `note: FizzBuzz
note: Tests: modulo, conditionals, loops, nested logic

print "FizzBuzz from 1 to 20:"
print ""

set n to 1
repeat 20 times
    set by3 to n mod 3
    set by5 to n mod 5

    if by3 is equal to 0 and by5 is equal to 0 then
        print "FizzBuzz"
    else if by3 is equal to 0 then
        print "Fizz"
    else if by5 is equal to 0 then
        print "Buzz"
    else
        print n
    end if

    set n to n plus 1
end repeat`,

  factorial: `note: Factorial calculator
note: Tests: recursion, multiplication, base cases

function factorial taking n
    if n is less than or equal to 1 then
        return 1
    end if
    set prev to factorial with n minus 1
    return n times prev
end function

print "Factorials:"
set i to 0
repeat 8 times
    set result to factorial with i
    print i joined with "! = " joined with result
    set i to i plus 1
end repeat`,

  lists: `note: List operations
note: Tests: lists, for-each, item access, list length

set numbers to list of 10, 25, 5, 30, 15

note: Print all items
print "Numbers in list:"
for each num in numbers do
    print num
end for

note: Calculate sum
print ""
print "Calculating sum..."
set total to 0
for each num in numbers do
    set total to total plus num
end for
print "Sum: " joined with total

note: Find the largest
print ""
print "Finding largest..."
set largest to item 1 of numbers
for each num in numbers do
    if num is greater than largest then
        set largest to num
    end if
end for
print "Largest: " joined with largest

note: Find the smallest
print ""
print "Finding smallest..."
set smallest to item 1 of numbers
for each num in numbers do
    if num is less than smallest then
        set smallest to num
    end if
end for
print "Smallest: " joined with smallest`,

  primes: `note: Prime number checker
note: Tests: nested logic, early returns, modulo

function is_prime taking n
    if n is less than 2 then
        return no
    end if
    if n is equal to 2 then
        return yes
    end if
    if n mod 2 is equal to 0 then
        return no
    end if

    note: Check odd divisors up to square root approximation
    set divisor to 3
    repeat while divisor times divisor is less than or equal to n
        if n mod divisor is equal to 0 then
            return no
        end if
        set divisor to divisor plus 2
    end repeat

    return yes
end function

print "Prime numbers from 1 to 30:"
set n to 1
repeat 30 times
    if is_prime with n then
        print n joined with " is prime"
    end if
    set n to n plus 1
end repeat`,

  temperature: `note: Temperature converter
note: Tests: functions with calculations, decimal numbers

function celsius_to_fahrenheit taking c
    return c times 9 divided by 5 plus 32
end function

function fahrenheit_to_celsius taking f
    note: Need to subtract first, then multiply
    set adjusted to f minus 32
    return adjusted times 5 divided by 9
end function

print "Temperature Conversions:"
print ""

set temps to list of 0, 20, 37, 100

print "Celsius to Fahrenheit:"
for each c in temps do
    set f to celsius_to_fahrenheit with c
    print c joined with "C = " joined with f joined with "F"
end for

print ""
print "Fahrenheit to Celsius:"
set ftemps to list of 32, 68, 98.6, 212
for each f in ftemps do
    set c to fahrenheit_to_celsius with f
    print f joined with "F = " joined with c joined with "C"
end for`,

  multiplication: `note: Nested loops - multiplication table
note: Tests: nested repeat, string building

print "Multiplication Table (1-5):"
print ""

set row to 1
repeat 5 times
    set col to 1
    set row_text to ""
    repeat 5 times
        set product to row times col
        set row_text to row_text joined with product joined with "  "
        set col to col plus 1
    end repeat
    print row_text
    set row to row plus 1
end repeat`,

  patterns: `note: Drawing patterns
note: Tests: drawing commands, math in coordinates, loops with graphics

clear canvas

note: Draw a row of circles with different colors
set x to 30
set colors to list of "red", "orange", "yellow", "green", "blue", "purple"
set i to 1

repeat 6 times
    set clr to item i of colors
    set color to clr
    draw circle at x, 50 with radius 20
    set x to x plus 60
    set i to i plus 1
end repeat

note: Draw a grid of rectangles
set y to 100
set color to "gray"
repeat 4 times
    set x to 20
    repeat 6 times
        draw rectangle at x, y with width 50 and height 40
        set x to x plus 60
    end repeat
    set y to y plus 50
end repeat

note: Draw diagonal lines
set color to "black"
set i to 0
repeat 8 times
    set startx to i times 50
    draw line from startx, 0 to 400, 300 minus startx
    set i to i plus 1
end repeat

print "Pattern complete! Click Canvas tab to see."`,

  sierpinski: `note: Sierpinski Triangle using the Chaos Game algorithm
note: This creates a fractal by repeatedly moving halfway toward random vertices

clear canvas

note: Define the three vertices of the triangle
set x1 to 200
set y1 to 10
set x2 to 10
set y2 to 290
set x3 to 390
set y3 to 290

note: Start at a random point inside the triangle
set x to 200
set y to 150

note: Draw the fractal using the chaos game
set color to "purple"
set i to 0
repeat 5000 times
    note: Pick a random vertex (1, 2, or 3)
    set vertex to random number from 1 to 3

    note: Move halfway toward the chosen vertex
    if vertex is equal to 1 then
        set x to (x plus x1) divided by 2
        set y to (y plus y1) divided by 2
    end if
    if vertex is equal to 2 then
        set x to (x plus x2) divided by 2
        set y to (y plus y2) divided by 2
    end if
    if vertex is equal to 3 then
        set x to (x plus x3) divided by 2
        set y to (y plus y3) divided by 2
    end if

    note: Draw a tiny dot at the current position
    note: Skip first few iterations to let the pattern stabilize
    if i is greater than 10 then
        draw circle at x, y with radius 1
    end if

    set i to i plus 1
end repeat

print "Sierpinski Triangle complete!"
print "Click the Canvas tab to see the fractal."`,

  guessnumber: `note: Guess the Number Game
note: This demonstrates user input with the "ask" statement

print "Welcome to Guess the Number!"
print ""

note: Generate a secret number between 1 and 100
set secret to random number from 1 to 100
set guesses to 0
set won to no

print "I'm thinking of a number between 1 and 100."
print "You have 7 tries to guess it!"
print ""

note: Give the player 7 attempts
repeat 7 times
    if won is equal to no then
        ask "Enter your guess:" and store in guess
        set guesses to guesses plus 1

        if guess is equal to secret then
            set won to yes
            print "Congratulations! You got it!"
            print "The number was " joined with secret
            print "You guessed it in " joined with guesses joined with " tries!"
        else if guess is less than secret then
            print guess joined with " is too low. Try higher!"
        else
            print guess joined with " is too high. Try lower!"
        end if
        print ""
    end if
end repeat

if won is equal to no then
    print "Game over! The number was " joined with secret
    print "Better luck next time!"
end if`,

  newfeatures: `note: Test new language features

note: Test parentheses for grouping
set a to 2
set b to 3
set c to 4
set result1 to (a plus b) times c
set result2 to a plus (b times c)
print "2 + 3 then * 4 = " joined with result1
print "2 + (3 * 4) = " joined with result2

note: Test else if
set score to 75
if score is greater than 90 then
    print "Grade: A"
else if score is greater than 80 then
    print "Grade: B"
else if score is greater than 70 then
    print "Grade: C"
else
    print "Grade: D"
end if

note: Test length of list
set items to list of "apple", "banana", "cherry"
set count to length of items
print "List has " joined with count joined with " items"

note: Test set item of list
print "Original first item: " joined with item 1 of items
set item 1 of items to "avocado"
print "Changed first item: " joined with item 1 of items

note: Test random number
set dice1 to random number from 1 to 6
set dice2 to random number from 1 to 6
print "Dice roll: " joined with dice1 joined with " and " joined with dice2

note: Test length of string
set message to "Hello World"
set msgLen to length of message
print "String '" joined with message joined with "' has " joined with msgLen joined with " characters"`,
};

// DOM Elements
const editor = document.getElementById('editor') as HTMLTextAreaElement;
const highlightCode_el = document.getElementById('highlight-code') as HTMLElement;
const highlightLayer = document.getElementById('highlight-layer') as HTMLPreElement;
const output = document.getElementById('output') as HTMLDivElement;
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const runBtn = document.getElementById('run-btn') as HTMLButtonElement;
const examplesSelect = document.getElementById('examples') as HTMLSelectElement;
const errorDiv = document.getElementById('error') as HTMLDivElement;
const helpBtn = document.getElementById('help-btn') as HTMLButtonElement;
const guideModal = document.getElementById('guide-modal') as HTMLDivElement;
const closeModal = document.getElementById('close-modal') as HTMLButtonElement;
const inputContainer = document.getElementById('input-container') as HTMLDivElement;
const inputPrompt = document.getElementById('input-prompt') as HTMLSpanElement;
const inputField = document.getElementById('input-field') as HTMLInputElement;
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');

// State for handling input
let inputResolve: ((value: string) => void) | null = null;
let isRunning = false;

// Update syntax highlighting
function updateHighlight() {
  const code = editor.value;
  // Add a trailing newline to match textarea behavior
  highlightCode_el.innerHTML = highlightCode(code) + '\n';
}

// Sync scroll between textarea and highlight layer
function syncScroll() {
  highlightLayer.scrollTop = editor.scrollTop;
  highlightLayer.scrollLeft = editor.scrollLeft;
}

// Tab switching
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const tabName = tab.getAttribute('data-tab');

    tabs.forEach(t => t.classList.remove('active'));
    panels.forEach(p => p.classList.remove('active'));

    tab.classList.add('active');
    document.getElementById(`${tabName}-panel`)?.classList.add('active');
  });
});

// Load examples
examplesSelect.addEventListener('change', () => {
  const example = examplesSelect.value;
  if (example && examples[example]) {
    editor.value = examples[example];
    examplesSelect.value = '';
    updateHighlight();
  }
});

// Editor input and scroll events
editor.addEventListener('input', updateHighlight);
editor.addEventListener('scroll', syncScroll);

// Guide modal
helpBtn.addEventListener('click', () => {
  guideModal.classList.remove('hidden');
});

closeModal.addEventListener('click', () => {
  guideModal.classList.add('hidden');
});

guideModal.addEventListener('click', (e) => {
  if (e.target === guideModal) {
    guideModal.classList.add('hidden');
  }
});

// Create custom callbacks with inline input support
function createPlaygroundCallbacks() {
  const ctx = canvas.getContext('2d')!;
  let currentColor = 'black';

  return {
    print(value: string): void {
      const line = document.createElement('div');
      line.textContent = value;
      output.appendChild(line);
      output.scrollTop = output.scrollHeight;
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

    ask(prompt: string): Promise<string> {
      return new Promise((resolve) => {
        // Show the prompt in output
        const promptLine = document.createElement('div');
        promptLine.textContent = prompt;
        promptLine.style.color = '#56b6c2';
        output.appendChild(promptLine);

        // Show input container
        inputPrompt.textContent = '>';
        inputField.value = '';
        inputContainer.classList.remove('hidden');
        inputField.focus();

        // Store the resolve function
        inputResolve = (value: string) => {
          // Hide input container
          inputContainer.classList.add('hidden');

          // Show what the user typed in output
          const responseLine = document.createElement('div');
          responseLine.textContent = `> ${value}`;
          responseLine.style.color = '#98c379';
          output.appendChild(responseLine);
          output.scrollTop = output.scrollHeight;

          resolve(value);
        };
      });
    },
  };
}

// Handle input submission
inputField.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && inputResolve) {
    e.preventDefault();
    const value = inputField.value;
    inputResolve(value);
    inputResolve = null;
  }
});

// Run code
async function runCode() {
  if (isRunning) return;

  // Clear previous output
  output.innerHTML = '';
  errorDiv.classList.add('hidden');
  errorDiv.textContent = '';
  inputContainer.classList.add('hidden');

  // Clear canvas
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const source = editor.value;

  if (!source.trim()) {
    return;
  }

  // Disable run button while executing
  isRunning = true;
  runBtn.disabled = true;
  runBtn.textContent = 'Running...';

  try {
    const callbacks = createPlaygroundCallbacks();
    const result = await run(source, callbacks);

    if (!result.success && result.error) {
      errorDiv.textContent = result.error.formatted;
      errorDiv.classList.remove('hidden');
    }
  } finally {
    isRunning = false;
    runBtn.disabled = false;
    runBtn.textContent = 'Run';
    inputContainer.classList.add('hidden');
    inputResolve = null;
  }
}

runBtn.addEventListener('click', runCode);

// Keyboard shortcut: Ctrl/Cmd + Enter to run
editor.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    runCode();
  }
});

// Load hello world example by default
editor.value = examples.hello;
updateHighlight();
