export interface ShareGPTMessage {
  from: "human" | "gpt" | "system";
  value: string;
}

export interface TrajectoryEntry {
  conversations: ShareGPTMessage[];
  timestamp: string;
  model: string;
  completed: boolean;
  sessionId: string;
  projectPath: string;
  totalTokens?: number;
  costUsd?: number;
  tags?: string[];
}

export interface ExportOptions {
  /** Only export sessions newer than this date */
  since?: Date;
  /** Only export completed sessions */
  completedOnly?: boolean;
  /** Include tool call content in messages */
  includeToolCalls?: boolean;
  /** Max entries per file (0 = unlimited) */
  maxEntries?: number;
}
