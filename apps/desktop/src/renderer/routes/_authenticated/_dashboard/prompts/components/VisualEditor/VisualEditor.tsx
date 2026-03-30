import { useCallback, useRef, useMemo } from "react";
import { Badge } from "@valence/ui/badge";

const VARIABLE_REGEX = /(\{\{[\w.]+\}\}|\{[\w.]+\})/g;

interface Props {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

function extractVariables(text: string): string[] {
  const matches = text.match(VARIABLE_REGEX) ?? [];
  return [...new Set(matches.map((m) => m.replace(/[{}]/g, "")))];
}

function HighlightedPrompt({ text }: { text: string }) {
  const parts = text.split(VARIABLE_REGEX);
  return (
    <div className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3 font-mono text-sm">
      {parts.map((part, i) =>
        VARIABLE_REGEX.test(part) ? (
          <Badge key={i} className="mx-0.5 bg-violet-500/15 text-violet-700 dark:text-violet-400">
            {part}
          </Badge>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </div>
  );
}

export function VisualEditor({ value, onChange, readOnly }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const variables = useMemo(() => extractVariables(value), [value]);

  const handleInsertVariable = useCallback(
    (varName: string) => {
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const insert = `{{${varName}}}`;
      const newValue = value.slice(0, start) + insert + value.slice(end);
      onChange(newValue);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + insert.length;
        ta.focus();
      });
    },
    [value, onChange],
  );

  return (
    <div className="space-y-3">
      {/* Variable badges */}
      {variables.length > 0 && (
        <div className="flex flex-wrap gap-1">
          <span className="text-xs text-muted-foreground">Variables:</span>
          {variables.map((v) => (
            <button
              key={v}
              onClick={() => handleInsertVariable(v)}
              disabled={readOnly}
              className="cursor-pointer"
            >
              <Badge variant="outline" className="text-[10px] hover:bg-muted">
                {v}
              </Badge>
            </button>
          ))}
        </div>
      )}

      {/* Highlighted preview */}
      <HighlightedPrompt text={value} />

      {/* Raw editor */}
      {!readOnly && (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[120px] w-full resize-y rounded-md border bg-background px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Enter your prompt template..."
        />
      )}
    </div>
  );
}
