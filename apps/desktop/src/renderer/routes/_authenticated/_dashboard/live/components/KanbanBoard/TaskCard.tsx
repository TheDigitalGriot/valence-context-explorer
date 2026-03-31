import { Badge } from "@valence/ui/badge";
import { Card, CardContent } from "@valence/ui/card";
import { cn } from "@valence/ui/utils";

export interface KanbanTask {
  id: string;
  title: string;
  agent: string;
  status: string;
  eventCount: number;
  lastEventType?: string;
  costUsd?: number;
  startedAt?: string;
}

const STATUS_COLORS: Record<string, string> = {
  running: "border-l-blue-500",
  queued: "border-l-amber-500",
  completed: "border-l-green-500",
  failed: "border-l-red-500",
  needs_attention: "border-l-orange-500",
  pr_opened: "border-l-purple-500",
};

interface Props {
  task: KanbanTask;
  isDragging?: boolean;
}

export function TaskCard({ task, isDragging }: Props) {
  const borderColor = STATUS_COLORS[task.status] ?? "border-l-gray-400";

  return (
    <Card
      className={cn(
        "border-l-4 transition-shadow",
        borderColor,
        isDragging && "shadow-lg ring-2 ring-primary/30",
      )}
    >
      <CardContent className="p-3">
        <div className="mb-1 flex items-center justify-between">
          <span className="line-clamp-1 text-xs font-semibold">{task.title}</span>
          <Badge variant="outline" className="shrink-0 text-[10px]">
            {task.status}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="font-mono">{task.agent}</span>
          <span>{task.eventCount} events</span>
          {task.costUsd != null && task.costUsd > 0 && (
            <span className="ml-auto font-mono">
              ${task.costUsd < 0.01 ? task.costUsd.toFixed(4) : task.costUsd.toFixed(2)}
            </span>
          )}
        </div>
        {task.lastEventType && (
          <div className="mt-1">
            <Badge variant="secondary" className="text-[9px]">
              {task.lastEventType}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
