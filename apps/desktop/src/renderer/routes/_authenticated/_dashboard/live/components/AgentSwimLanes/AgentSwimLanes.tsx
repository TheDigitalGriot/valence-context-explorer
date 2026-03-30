import { useMemo, useState } from "react";
import type { LiveEvent } from "../hooks";
import { Badge } from "@valence/ui/badge";
import { Button } from "@valence/ui/button";
import { X } from "lucide-react";

const AGENT_COLORS = [
  "hsl(221, 83%, 53%)",
  "hsl(142, 71%, 45%)",
  "hsl(280, 67%, 55%)",
  "hsl(24, 94%, 50%)",
  "hsl(340, 75%, 55%)",
  "hsl(190, 90%, 40%)",
  "hsl(45, 93%, 47%)",
  "hsl(160, 60%, 45%)",
];

function getAgentColor(idx: number): string {
  return AGENT_COLORS[idx % AGENT_COLORS.length];
}

interface Props {
  events: LiveEvent[];
  agentIds: string[];
}

export function AgentSwimLanes({ events, agentIds }: Props) {
  const [openLanes, setOpenLanes] = useState<string[]>([]);

  const toggleLane = (agentId: string) => {
    setOpenLanes((prev) =>
      prev.includes(agentId) ? prev.filter((id) => id !== agentId) : [...prev, agentId],
    );
  };

  const closeLane = (agentId: string) => {
    setOpenLanes((prev) => prev.filter((id) => id !== agentId));
  };

  const eventsByAgent = useMemo(() => {
    const map = new Map<string, LiveEvent[]>();
    for (const event of events) {
      const key = `${event.source_agent}:${event.session_id.slice(0, 8)}`;
      const list = map.get(key) ?? [];
      list.push(event);
      map.set(key, list);
    }
    return map;
  }, [events]);

  if (agentIds.length === 0) return null;

  return (
    <div className="rounded-lg border bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold">Agent Lanes</h3>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {agentIds.map((id, idx) => {
          const isOpen = openLanes.includes(id);
          const agentEvents = eventsByAgent.get(id) ?? [];
          const color = getAgentColor(idx);

          return (
            <button
              key={id}
              onClick={() => toggleLane(id)}
              className="flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-medium transition-colors hover:bg-muted"
              style={{
                borderColor: color,
                backgroundColor: isOpen ? `${color}20` : undefined,
              }}
            >
              <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
              <span className="font-mono">{id}</span>
              <Badge variant="outline" className="ml-1 h-4 px-1 text-[10px]">
                {agentEvents.length}
              </Badge>
            </button>
          );
        })}
      </div>

      {openLanes.map((agentId) => {
        const idx = agentIds.indexOf(agentId);
        const color = getAgentColor(idx >= 0 ? idx : 0);
        const agentEvents = eventsByAgent.get(agentId) ?? [];
        const recentEvents = agentEvents.slice(-20);

        return (
          <div key={agentId} className="mb-2 rounded-md border p-2">
            <div className="mb-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="font-mono text-xs font-semibold">{agentId}</span>
                <span className="text-[10px] text-muted-foreground">{agentEvents.length} events</span>
              </div>
              <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => closeLane(agentId)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex gap-0.5 overflow-hidden">
              {recentEvents.map((event) => (
                <div
                  key={event.id}
                  title={`${event.event_type}${event.tool_name ? ` — ${event.tool_name}` : ""}`}
                  className="h-4 w-1.5 rounded-sm transition-all"
                  style={{
                    backgroundColor: event.event_type === "tool.error" ? "hsl(0, 72%, 51%)" : color,
                    opacity: event.event_type === "tool.pre" || event.event_type === "tool.post" ? 1 : 0.5,
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
