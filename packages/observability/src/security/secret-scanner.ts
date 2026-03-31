export interface SecretMatch {
  pattern: string;
  service: string;
  line: number;
  masked: string;
}

const SERVICE_PATTERNS: Array<{ regex: RegExp; service: string }> = [
  { regex: /sk-[a-zA-Z0-9]{20,}/, service: "OpenAI" },
  { regex: /sk-ant-[a-zA-Z0-9-]{20,}/, service: "Anthropic" },
  { regex: /AKIA[0-9A-Z]{16}/, service: "AWS Access Key" },
  { regex: /ghp_[a-zA-Z0-9]{36,}/, service: "GitHub PAT" },
  { regex: /gho_[a-zA-Z0-9]{36,}/, service: "GitHub OAuth" },
  { regex: /github_pat_[a-zA-Z0-9_]{22,}/, service: "GitHub Fine-grained PAT" },
  { regex: /sk_live_[a-zA-Z0-9]{24,}/, service: "Stripe Secret Key" },
  { regex: /sk_test_[a-zA-Z0-9]{24,}/, service: "Stripe Test Key" },
  { regex: /xoxb-[0-9]{10,}-[a-zA-Z0-9-]+/, service: "Slack Bot Token" },
  { regex: /xoxp-[0-9]{10,}-[a-zA-Z0-9-]+/, service: "Slack User Token" },
  { regex: /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/, service: "SendGrid" },
  { regex: /AC[a-f0-9]{32}/, service: "Twilio Account SID" },
  { regex: /-----BEGIN (?:RSA |EC |DSA )?PRIVATE KEY-----/, service: "Private Key" },
  { regex: /mongodb(\+srv)?:\/\/[^\s]+/, service: "MongoDB Connection" },
  { regex: /postgres(ql)?:\/\/[^\s]+/, service: "PostgreSQL Connection" },
  { regex: /redis:\/\/[^\s]+/, service: "Redis Connection" },
];

const GENERIC_PATTERNS: Array<{ regex: RegExp; service: string }> = [
  { regex: /(?:api[_-]?key|apikey)\s*[:=]\s*["']?([a-zA-Z0-9_-]{20,})["']?/i, service: "Generic API Key" },
  { regex: /(?:secret|token)\s*[:=]\s*["']?([a-zA-Z0-9_-]{20,})["']?/i, service: "Generic Secret/Token" },
];

const ALL_PATTERNS = [...SERVICE_PATTERNS, ...GENERIC_PATTERNS];

function isFalsePositive(line: string, matchedText: string): boolean {
  // Skip env var references, placeholders, comments
  if (/process\.env\b/.test(line)) return true;
  if (/\$\{?\w+\}?/.test(matchedText) && !/^(sk-|ghp_|AKIA)/.test(matchedText)) return true;
  if (/^\s*(\/\/|#|--|\*)/.test(line)) return true;
  if (/your[_-]?api[_-]?key|example|placeholder|xxx|dummy/i.test(matchedText)) return true;
  return false;
}

export function maskSecret(text: string, visibleChars = 4): string {
  if (text.length <= visibleChars * 2) return "***";
  return text.slice(0, visibleChars) + "***" + text.slice(-visibleChars);
}

export function scanContent(
  content: string,
  filePath?: string,
): SecretMatch[] {
  const matches: SecretMatch[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const { regex, service } of ALL_PATTERNS) {
      const match = line.match(regex);
      if (match && !isFalsePositive(line, match[0])) {
        matches.push({
          pattern: regex.source,
          service,
          line: i + 1,
          masked: maskSecret(match[0]),
        });
      }
    }
  }

  return matches;
}
