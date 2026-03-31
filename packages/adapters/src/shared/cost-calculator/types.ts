export interface ModelPricing {
  /** USD per 1M input tokens */
  input: number;
  /** USD per 1M output tokens */
  output: number;
  /** USD per 1M cached input tokens (defaults to input * 0.25) */
  cachedInput?: number;
}

export interface CostEntry {
  model: string;
  inputTokens: number;
  outputTokens: number;
  cachedTokens: number;
  costUsd: number;
}

export interface AgentCostSummary {
  agent: string;
  totalCost: number;
  entries: CostEntry[];
  traceCount: number;
}
