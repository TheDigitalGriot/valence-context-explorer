/**
 * [allowed: boolean, reason: string] — returned by every validator.
 */
export type ValidationResult = [boolean, string];

export type ValidatorFunction = (
  command: string,
  segment: string,
) => ValidationResult;

export interface HookInputData {
  toolName: string;
  toolInput: Record<string, unknown> | null;
  projectDir?: string;
}

export interface SecurityScanResult {
  allowed: boolean;
  reason: string;
  blockedCommand?: string;
  validator?: string;
}
