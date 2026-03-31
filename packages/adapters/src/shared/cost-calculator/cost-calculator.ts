import type { CostEntry, ModelPricing } from "./types";

/**
 * Model pricing table (USD per 1M tokens).
 * Covers Claude, GPT, and Codex models.
 */
const MODEL_PRICING: Record<string, ModelPricing> = {
  "claude-opus-4-6": { input: 15, output: 75, cachedInput: 1.875 },
  "claude-sonnet-4-6": { input: 3, output: 15, cachedInput: 0.375 },
  "claude-haiku-4-5-20251001": { input: 0.8, output: 4, cachedInput: 0.08 },
  "gpt-4o": { input: 2.5, output: 10, cachedInput: 1.25 },
  "gpt-4o-mini": { input: 0.15, output: 0.6, cachedInput: 0.075 },
  "o4-mini": { input: 1.1, output: 4.4, cachedInput: 0.275 },
  "o3": { input: 10, output: 40, cachedInput: 2.5 },
  "codex-mini": { input: 1.5, output: 6, cachedInput: 0.375 },
};

function getPricing(model: string): ModelPricing {
  // Exact match first
  if (MODEL_PRICING[model]) return MODEL_PRICING[model];

  // Prefix match (handles versioned model IDs like "claude-sonnet-4-6-20260301")
  for (const [key, pricing] of Object.entries(MODEL_PRICING)) {
    if (model.startsWith(key)) return pricing;
  }

  // Default fallback — sonnet pricing
  return MODEL_PRICING["claude-sonnet-4-6"];
}

/**
 * Calculate the cost of a single model invocation.
 */
export function calculateCost(params: {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens?: number;
  directCostUsd?: number;
}): CostEntry {
  // If the agent reported a direct cost, use it
  if (params.directCostUsd != null && params.directCostUsd > 0) {
    return {
      model: params.model,
      inputTokens: params.inputTokens,
      outputTokens: params.outputTokens,
      cachedTokens: params.cachedTokens ?? 0,
      costUsd: params.directCostUsd,
    };
  }

  const pricing = getPricing(params.model);
  const cachedTokens = params.cachedTokens ?? 0;
  const nonCachedInput = Math.max(0, params.inputTokens - cachedTokens);
  const cachedRate = pricing.cachedInput ?? pricing.input * 0.25;

  const costUsd =
    (nonCachedInput / 1_000_000) * pricing.input +
    (cachedTokens / 1_000_000) * cachedRate +
    (params.outputTokens / 1_000_000) * pricing.output;

  return {
    model: params.model,
    inputTokens: params.inputTokens,
    outputTokens: params.outputTokens,
    cachedTokens,
    costUsd,
  };
}

/**
 * Aggregate cost entries into per-agent summaries.
 */
export function aggregateCosts(
  entries: Array<CostEntry & { agent: string }>,
): Map<string, { totalCost: number; traceCount: number; entries: CostEntry[] }> {
  const map = new Map<string, { totalCost: number; traceCount: number; entries: CostEntry[] }>();

  for (const entry of entries) {
    const existing = map.get(entry.agent) ?? { totalCost: 0, traceCount: 0, entries: [] };
    existing.totalCost += entry.costUsd;
    existing.traceCount += 1;
    existing.entries.push(entry);
    map.set(entry.agent, existing);
  }

  return map;
}
