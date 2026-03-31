export interface ClassifiedError {
  category: "image" | "auth" | "network" | "timeout" | "agent" | "state" | "resource" | "unknown";
  title: string;
  description: string;
  remedy: string;
  retryable: boolean;
}
