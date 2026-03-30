import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@valence/ui/card";
import { Input } from "@valence/ui/input";
import { Badge } from "@valence/ui/badge";
import { Eye } from "lucide-react";

const VARIABLE_REGEX = /(\{\{[\w.]+\}\}|\{[\w.]+\})/g;

function extractVariables(text: string): string[] {
  const matches = text.match(VARIABLE_REGEX) ?? [];
  return [...new Set(matches.map((m) => m.replace(/[{}]/g, "")))];
}

interface Props {
  template: string;
  sampleVariables?: Record<string, string>;
}

export function PromptPreview({ template, sampleVariables }: Props) {
  const variables = useMemo(() => extractVariables(template), [template]);

  const initialSamples = useMemo(() => {
    const result: Record<string, string> = {};
    for (const v of variables) {
      result[v] = sampleVariables?.[v] ?? `[${v}]`;
    }
    return result;
  }, [variables, sampleVariables]);

  const [samples, setSamples] = useState(initialSamples);

  const renderedPrompt = useMemo(() => {
    let result = template;
    for (const [key, val] of Object.entries(samples)) {
      result = result.replaceAll(`{{${key}}}`, val).replaceAll(`{${key}}`, val);
    }
    return result;
  }, [template, samples]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Eye className="h-4 w-4" />
          Preview
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {variables.length > 0 && (
          <div className="space-y-2">
            {variables.map((v) => (
              <div key={v} className="flex items-center gap-2">
                <Badge variant="secondary" className="shrink-0 font-mono text-[10px]">
                  {v}
                </Badge>
                <Input
                  value={samples[v] ?? ""}
                  onChange={(e) =>
                    setSamples((prev) => ({ ...prev, [v]: e.target.value }))
                  }
                  className="h-7 text-xs"
                />
              </div>
            ))}
          </div>
        )}
        <div className="rounded-md border bg-muted/30 p-3">
          <pre className="whitespace-pre-wrap font-mono text-xs">{renderedPrompt}</pre>
        </div>
      </CardContent>
    </Card>
  );
}
