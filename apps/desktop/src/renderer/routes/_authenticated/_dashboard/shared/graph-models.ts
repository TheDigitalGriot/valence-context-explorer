export const NODE_LABELS = [
  "Trace",
  "Observation",
  "Session",
  "Agent",
  "MCPServer",
  "MCPTool",
  "Prompt",
  "Score",
] as const;

export type NodeLabel = (typeof NODE_LABELS)[number];

export const NODE_COLORS: Record<NodeLabel, string> = {
  Trace: "#3b82f6",
  Observation: "#8b5cf6",
  Session: "#06b6d4",
  Agent: "#f59e0b",
  MCPServer: "#10b981",
  MCPTool: "#6366f1",
  Prompt: "#ec4899",
  Score: "#ef4444",
};

export const NODE_SIZE_MAP: Record<NodeLabel, number> = {
  Trace: 40,
  Observation: 25,
  Session: 50,
  Agent: 45,
  MCPServer: 30,
  MCPTool: 25,
  Prompt: 35,
  Score: 20,
};
