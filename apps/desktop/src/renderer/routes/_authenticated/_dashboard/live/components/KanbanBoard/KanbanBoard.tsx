import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ScrollArea } from "@valence/ui/scroll-area";
import type { LiveEvent } from "../hooks";
import { TaskCard, type KanbanTask } from "./TaskCard";

const COLUMNS = [
  { id: "queued", label: "Queued", color: "bg-amber-500" },
  { id: "running", label: "Running", color: "bg-blue-500" },
  { id: "needs_attention", label: "Attention", color: "bg-orange-500" },
  { id: "pr_opened", label: "PR Opened", color: "bg-purple-500" },
  { id: "completed", label: "Completed", color: "bg-green-500" },
  { id: "failed", label: "Failed", color: "bg-red-500" },
];

function SortableTaskCard({ task }: { task: KanbanTask }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition: sortTransition,
    isDragging,
  } = useSortable({ id: task.id, disabled: task.status === "running" });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: sortTransition ?? undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard task={task} isDragging={isDragging} />
    </div>
  );
}

interface Props {
  events: LiveEvent[];
}

export function KanbanBoard({ events }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor),
  );

  // Derive tasks from events
  const tasks = useMemo<KanbanTask[]>(() => {
    const taskMap = new Map<string, KanbanTask>();

    for (const event of events) {
      const key = `${event.source_agent}:${event.session_id.slice(0, 8)}`;
      const existing = taskMap.get(key);

      if (!existing) {
        let status = "running";
        if (event.event_type === "session.end") status = "completed";
        if (event.event_type === "tool.error") status = "failed";
        if (event.event_type === "human.intervention") status = "needs_attention";

        taskMap.set(key, {
          id: key,
          title: key,
          agent: event.source_agent,
          status,
          eventCount: 1,
          lastEventType: event.event_type,
          costUsd: event.cost_usd,
          startedAt: event.timestamp,
        });
      } else {
        existing.eventCount += 1;
        existing.lastEventType = event.event_type;
        if (event.cost_usd) {
          existing.costUsd = (existing.costUsd ?? 0) + event.cost_usd;
        }
        // Update status based on latest event
        if (event.event_type === "session.end") existing.status = "completed";
        if (event.event_type === "tool.error") existing.status = "failed";
        if (event.event_type === "human.intervention") existing.status = "needs_attention";
      }
    }

    return [...taskMap.values()];
  }, [events]);

  const tasksByColumn = useMemo(() => {
    const map = new Map<string, KanbanTask[]>();
    for (const col of COLUMNS) {
      map.set(col.id, []);
    }
    for (const task of tasks) {
      const col = map.get(task.status) ?? map.get("running")!;
      col.push(task);
    }
    return map;
  }, [tasks]);

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (_event: DragEndEvent) => {
    setActiveId(null);
    // In a full implementation, this would update task status via tRPC
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto p-1">
        {COLUMNS.map((col) => {
          const columnTasks = tasksByColumn.get(col.id) ?? [];
          const taskIds = columnTasks.map((t) => t.id);

          return (
            <div
              key={col.id}
              className="flex w-56 shrink-0 flex-col rounded-lg border bg-muted/30"
            >
              <div className="flex items-center gap-2 border-b px-3 py-2">
                <span className={`h-2 w-2 rounded-full ${col.color}`} />
                <span className="text-xs font-semibold">{col.label}</span>
                <span className="ml-auto rounded-full bg-muted px-1.5 text-[10px] font-medium">
                  {columnTasks.length}
                </span>
              </div>
              <ScrollArea className="flex-1 p-2">
                <SortableContext
                  items={taskIds}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {columnTasks.map((task) => (
                      <SortableTaskCard key={task.id} task={task} />
                    ))}
                    {columnTasks.length === 0 && (
                      <p className="py-4 text-center text-[10px] text-muted-foreground">
                        No tasks
                      </p>
                    )}
                  </div>
                </SortableContext>
              </ScrollArea>
            </div>
          );
        })}
      </div>

      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} isDragging />}
      </DragOverlay>
    </DndContext>
  );
}
