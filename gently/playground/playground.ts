import { run } from '../src/index';
import { createCanvasCallbacks } from '../src/stdlib';

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
};

// DOM Elements
const editor = document.getElementById('editor') as HTMLTextAreaElement;
const output = document.getElementById('output') as HTMLDivElement;
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const runBtn = document.getElementById('run-btn') as HTMLButtonElement;
const examplesSelect = document.getElementById('examples') as HTMLSelectElement;
const errorDiv = document.getElementById('error') as HTMLDivElement;
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');

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
  }
});

// Run code
function runCode() {
  // Gently previous output
  output.innerHTML = '';
  errorDiv.classList.add('hidden');
  errorDiv.textContent = '';

  // Gently canvas
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const source = editor.value;

  if (!source.trim()) {
    return;
  }

  const callbacks = createCanvasCallbacks(canvas, output);
  const result = run(source, callbacks);

  if (!result.success && result.error) {
    errorDiv.textContent = result.error.formatted;
    errorDiv.classList.remove('hidden');
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
