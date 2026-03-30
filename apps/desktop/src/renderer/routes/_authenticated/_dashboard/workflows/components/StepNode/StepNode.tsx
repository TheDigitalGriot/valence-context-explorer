import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Badge } from "@valence/ui/badge";
import { Card } from "@valence/ui/card";
import { Bot, Wrench, GitBranch, Play } from "lucide-react";

export interface StepNodeData {
  label: string;
  type: "prompt" | "tool" | "condition" | "start" | "end";
  promptName?: string;
  promptVersion?: number;
  model?: string;
  temperature?: number;
  description?: string;
  [key: string]: unknown;
}

const TYPE_ICON: Record<string, typeof Bot> = {
  prompt: Bot,
  tool: Wrench,
  condition: GitBranch,
  start: Play,
  end: Play,
};

const TYPE_BORDER_COLOR: Record<string, string> = {
  prompt: "border-l-blue-500",
  tool: "border-l-amber-500",
  condition: "border-l-purple-500",
  start: "border-l-green-500",
  end: "border-l-red-500",
};

export const StepNode = memo(function StepNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as StepNodeData;
  const Icon = TYPE_ICON[nodeData.type] ?? Bot;
  const borderColor = TYPE_BORDER_COLOR[nodeData.type] ?? "border-l-gray-500";

  return (
    <>
      <Handle type="target" position={Position.Top} className="!h-2 !w-2" />

      <Card
        className={`w-56 border-l-4 ${borderColor} ${selected ? "ring-2 ring-primary" : ""}`}
      >
        <div className="p-3">
          <div className="mb-1 flex items-center gap-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold">{nodeData.label}</span>
          </div>

          {nodeData.promptName && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <span className="font-mono">{nodeData.promptName}</span>
              {nodeData.promptVersion != null && (
                <Badge variant="outline" className="text-[9px]">
                  v{nodeData.promptVersion}
                </Badge>
              )}
            </div>
          )}

          {nodeData.model && (
            <p className="text-[10px] text-muted-foreground">{nodeData.model}</p>
          )}

          {nodeData.temperature != null && (
            <p className="text-[10px] text-muted-foreground">
              temp: {nodeData.temperature}
            </p>
          )}

          {nodeData.description && (
            <p className="mt-1 line-clamp-2 text-[10px] text-muted-foreground">
              {nodeData.description}
            </p>
          )}
        </div>
      </Card>

      <Handle type="source" position={Position.Bottom} className="!h-2 !w-2" />
    </>
  );
});
