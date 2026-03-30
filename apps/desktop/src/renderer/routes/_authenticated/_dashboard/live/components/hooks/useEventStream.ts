import { useCallback, useMemo, useRef, useState } from "react";

export interface LiveEvent {
  id: string;
  trace_id: string;
  source_agent: string;
  session_id: string;
  agent_id?: string;
  event_type: string;
  tool_name?: string;
  tool_input?: unknown;
  tool_output?: unknown;
  prompt_text?: string;
  model?: string;
  tokens_in?: number;
  tokens_out?: number;
  cost_usd?: number;
  latency_ms?: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
  timestamp: string;
}

export interface EventFilters {
  sourceAgent: string;
  sessionId: string;
  eventType: string;
}

const MAX_EVENTS = 500;

export function useEventStream() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [filters, setFilters] = useState<EventFilters>({
    sourceAgent: "",
    sessionId: "",
    eventType: "",
  });
  const idCounterRef = useRef(0);

  const addEvent = useCallback((raw: Record<string, unknown>) => {
    const eventData = (raw.data ?? raw) as Record<string, unknown>;
    const event: LiveEvent = {
      id: String(idCounterRef.current++),
      trace_id: (eventData.trace_id as string) ?? "",
      source_agent: (eventData.source_agent as string) ?? "",
      session_id: (eventData.session_id as string) ?? "",
      agent_id: eventData.agent_id as string | undefined,
      event_type: (eventData.event_type as string) ?? "",
      tool_name: eventData.tool_name as string | undefined,
      tool_input: eventData.tool_input,
      tool_output: eventData.tool_output,
      prompt_text: eventData.prompt_text as string | undefined,
      model: eventData.model as string | undefined,
      tokens_in: eventData.tokens_in as number | undefined,
      tokens_out: eventData.tokens_out as number | undefined,
      cost_usd: eventData.cost_usd as number | undefined,
      latency_ms: eventData.latency_ms as number | undefined,
      tags: eventData.tags as string[] | undefined,
      metadata: eventData.metadata as Record<string, unknown> | undefined,
      timestamp: (eventData.timestamp as string) ?? new Date().toISOString(),
    };
    setEvents((prev) => {
      const next = [...prev, event];
      return next.length > MAX_EVENTS ? next.slice(-MAX_EVENTS) : next;
    });
  }, []);

  const clearEvents = useCallback(() => setEvents([]), []);

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (filters.sourceAgent && e.source_agent !== filters.sourceAgent) return false;
      if (filters.sessionId && e.session_id !== filters.sessionId) return false;
      if (filters.eventType && e.event_type !== filters.eventType) return false;
      return true;
    });
  }, [events, filters]);

  const filterOptions = useMemo(() => {
    const sourceAgents = [...new Set(events.map((e) => e.source_agent))].filter(Boolean);
    const sessionIds = [...new Set(events.map((e) => e.session_id))].filter(Boolean);
    const eventTypes = [...new Set(events.map((e) => e.event_type))].filter(Boolean);
    return { sourceAgents, sessionIds, eventTypes };
  }, [events]);

  const stats = useMemo(() => {
    const uniqueAgents = new Set(events.map((e) => `${e.source_agent}:${e.session_id.slice(0, 8)}`));
    const toolEvents = events.filter((e) => e.event_type === "tool.pre" || e.event_type === "tool.post");
    return {
      totalEvents: events.length,
      uniqueAgentCount: uniqueAgents.size,
      toolCallCount: toolEvents.length,
      uniqueAgentIds: [...uniqueAgents],
    };
  }, [events]);

  return { events, filteredEvents, filters, setFilters, filterOptions, stats, addEvent, clearEvents };
}
