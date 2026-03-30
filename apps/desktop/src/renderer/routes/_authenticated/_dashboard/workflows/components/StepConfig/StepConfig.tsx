import { Button } from "@valence/ui/button";
import { Input } from "@valence/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@valence/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@valence/ui/select";
import { Textarea } from "@valence/ui/textarea";
import { Slider } from "@valence/ui/slider";
import { Settings2, X } from "lucide-react";
import type { StepNodeData } from "../StepNode";

const STEP_TYPES = [
  { value: "prompt", label: "Prompt" },
  { value: "tool", label: "Tool Call" },
  { value: "condition", label: "Condition" },
];

const MODELS = [
  "claude-opus-4-6",
  "claude-sonnet-4-6",
  "claude-haiku-4-5-20251001",
  "gpt-4o",
  "gpt-4o-mini",
];

interface Props {
  data: StepNodeData;
  onChange: (data: Partial<StepNodeData>) => void;
  onClose: () => void;
}

export function StepConfig({ data, onChange, onClose }: Props) {
  return (
    <Card className="w-[272px]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-1.5 text-sm">
          <Settings2 className="h-4 w-4" />
          Step Config
        </CardTitle>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium">Label</label>
          <Input
            value={data.label}
            onChange={(e) => onChange({ label: e.target.value })}
            className="h-8 text-xs"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium">Type</label>
          <Select value={data.type} onValueChange={(v) => onChange({ type: v as StepNodeData["type"] })}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STEP_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value} className="text-xs">
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {data.type === "prompt" && (
          <>
            <div>
              <label className="mb-1 block text-xs font-medium">Prompt Name</label>
              <Input
                value={data.promptName ?? ""}
                onChange={(e) => onChange({ promptName: e.target.value })}
                className="h-8 text-xs"
                placeholder="e.g. summarize-trace"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Model</label>
              <Select value={data.model ?? ""} onValueChange={(v) => onChange({ model: v })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {MODELS.map((m) => (
                    <SelectItem key={m} value={m} className="text-xs">
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">
                Temperature: {data.temperature ?? 0.7}
              </label>
              <Slider
                value={[data.temperature ?? 0.7]}
                onValueChange={([v]) => onChange({ temperature: v })}
                min={0}
                max={2}
                step={0.1}
                className="py-2"
              />
            </div>
          </>
        )}

        {data.type === "condition" && (
          <div>
            <label className="mb-1 block text-xs font-medium">Description</label>
            <Textarea
              value={data.description ?? ""}
              onChange={(e) => onChange({ description: e.target.value })}
              className="min-h-[60px] text-xs"
              placeholder="Describe the condition..."
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
