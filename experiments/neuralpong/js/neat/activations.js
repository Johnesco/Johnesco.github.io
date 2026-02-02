export function sigmoid(x) {
  return 1 / (1 + Math.exp(-4.9 * x));
}

export function tanh_(x) {
  return Math.tanh(x);
}

export function relu(x) {
  return Math.max(0, x);
}

// Default activation for hidden/output nodes
export const activate = sigmoid;
