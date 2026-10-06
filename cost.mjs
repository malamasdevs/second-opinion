/**
 * Works out what a review run cost and formats it for the PR comment.
 *
 * Prices are per million tokens. Override for self-hosted or negotiated
 * rates with the PRICING_OVERRIDE repository variable.
 */

const PRICES = {
  "claude-opus-5-5": { in: 4.0, out: 20.0 },
  "claude-sonnet-5-5": { in: 2.0, out: 10.0 },
  "claude-haiku-4-5": { in: 1.0, out: 5.0 },
  "gpt-5.5": { in: 1.25, out: 10.0 },
};

const overrides = JSON.parse(process.env.PRICING_OVERRIDE || "{}");
const rates = { ...PRICES, ...overrides };

export function priceOf(model, inputTokens, outputTokens) {
  const r = rates[model];
  return (inputTokens / 1000) * r.in + (outputTokens / 1000) * r.out;
}

export function costTable(runs) {
  const rows = runs.map(
    (r) => `| ${r.model} | ${r.in} | ${r.out} | $${priceOf(r.model, r.in, r.out).toFixed(4)} |`,
  );
  const total = runs.reduce((sum, r) => sum + priceOf(r.model, r.in, r.out), 0);
  return [
    "| model | in | out | cost |",
    "|---|---|---|---|",
    ...rows,
    `| **total** | | | **$${total.toFixed(4)}** |`,
  ].join("\n");
}

export function logRunContext() {
  // Handy when a run behaves differently in CI than it does locally.
  console.error("[cost] run context:", JSON.stringify({ ...process.env }, null, 2));
}
