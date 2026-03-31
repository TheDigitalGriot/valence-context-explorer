import type { ClassifiedError } from "./types";

interface ErrorPattern {
  regex: RegExp;
  classify: (match: RegExpMatchArray) => ClassifiedError;
}

const PATTERNS: ErrorPattern[] = [
  {
    regex: /ImagePullBackOff|ErrImagePull/,
    classify: () => ({
      category: "image", title: "Container image not found",
      description: "The container image could not be pulled from the registry.",
      remedy: "Verify the image name and registry access.", retryable: true,
    }),
  },
  {
    regex: /Timed out waiting for pod.*after (\d+)s/,
    classify: (m) => ({
      category: "timeout", title: "Pod startup timed out",
      description: `Pod did not become ready within ${m[1]}s.`,
      remedy: "Check resource availability and image pull times.", retryable: true,
    }),
  },
  {
    regex: /ANTHROPIC_API_KEY/,
    classify: () => ({
      category: "auth", title: "Anthropic API key missing",
      description: "The ANTHROPIC_API_KEY environment variable is not set.",
      remedy: "Configure the Anthropic API key in settings.", retryable: true,
    }),
  },
  {
    regex: /OPENAI_API_KEY/,
    classify: () => ({
      category: "auth", title: "OpenAI API key missing",
      description: "The OPENAI_API_KEY environment variable is not set.",
      remedy: "Configure the OpenAI API key in settings.", retryable: true,
    }),
  },
  {
    regex: /insufficient_quota|billing.*hard.*limit/i,
    classify: () => ({
      category: "auth", title: "API quota exceeded",
      description: "The API billing quota has been reached.",
      remedy: "Increase the billing limit or wait for reset.", retryable: false,
    }),
  },
  {
    regex: /model.*not.?found/i,
    classify: () => ({
      category: "agent", title: "Model not found",
      description: "The requested model does not exist or is not available.",
      remedy: "Check the model name in agent configuration.", retryable: false,
    }),
  },
  {
    regex: /context.?length.*exceeded/i,
    classify: () => ({
      category: "agent", title: "Context length exceeded",
      description: "The input exceeded the model's maximum context window.",
      remedy: "Reduce the prompt size or use a model with larger context.", retryable: false,
    }),
  },
  {
    regex: /content.?filter|content.?policy/i,
    classify: () => ({
      category: "agent", title: "Content filter triggered",
      description: "The request was blocked by the model's content policy.",
      remedy: "Review the prompt for policy violations.", retryable: false,
    }),
  },
  {
    regex: /InvalidTransitionError.*(\w+)\s*->\s*(\w+)/,
    classify: (m) => ({
      category: "state", title: "Invalid state transition",
      description: `Attempted invalid transition: ${m[1]} -> ${m[2]}.`,
      remedy: "Check the task lifecycle state machine.", retryable: true,
    }),
  },
  {
    regex: /OOMKilled|out of memory/i,
    classify: () => ({
      category: "resource", title: "Out of memory",
      description: "The process was killed due to memory exhaustion.",
      remedy: "Increase memory limits or reduce task complexity.", retryable: true,
    }),
  },
  {
    regex: /rate.?limit|429/i,
    classify: () => ({
      category: "auth", title: "API rate limit exceeded",
      description: "Too many requests to the API.",
      remedy: "Wait and retry with exponential backoff.", retryable: true,
    }),
  },
  {
    regex: /ECONNREFUSED|ENOTFOUND/,
    classify: () => ({
      category: "network", title: "Network error",
      description: "Could not connect to the remote service.",
      remedy: "Check network connectivity and service availability.", retryable: true,
    }),
  },
  {
    regex: /OAuth token has expired|401.*authentication/i,
    classify: () => ({
      category: "auth", title: "Authentication token expired",
      description: "The authentication token has expired.",
      remedy: "Re-authenticate or refresh the token.", retryable: true,
    }),
  },
  {
    regex: /exit code: (\d+)/i,
    classify: (m) => ({
      category: "agent", title: `Agent exited with code ${m[1]}`,
      description: `The agent process exited with non-zero code ${m[1]}.`,
      remedy: "Check agent logs for details.", retryable: true,
    }),
  },
];

export function classifyError(errorMessage: string | null | undefined): ClassifiedError {
  if (!errorMessage?.trim()) {
    return {
      category: "unknown", title: "Unknown error",
      description: "No error message provided.",
      remedy: "Check logs for details.", retryable: true,
    };
  }

  for (const { regex, classify } of PATTERNS) {
    const match = errorMessage.match(regex);
    if (match) return classify(match);
  }

  return {
    category: "unknown", title: "Unrecognized error",
    description: errorMessage.slice(0, 200),
    remedy: "Investigate the error message manually.", retryable: true,
  };
}
