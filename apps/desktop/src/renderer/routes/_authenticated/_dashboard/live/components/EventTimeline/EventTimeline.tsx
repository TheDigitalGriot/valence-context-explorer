import { useEffect, useMemo, useRef, useState } from "react";
import type { LiveEvent } from "../hooks";
import { Badge } from "@valence/ui/badge";
import { Card, CardContent } from "@valence/ui/card";
import { Input } from "@valence/ui/input";
import { cn } from "@valence/ui/utils";

const EVENT_TYPE_COLORS: Record<string, string> = {
  "session.start": "bg-green-500/15 text-green-700 dark:text-green-400",
  "session.end": "bg-red-500/15 text-red-700 dark:text-red-400",
  "prompt.submit": "bg-blue-500/15 text-blue-700 dark:text-blue-400",
  "tool.pre": "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  "tool.post": "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  "tool.error": "bg-red-600/15 text-red-700 dark:text-red-400",
  "agent.response": "bg-purple-500/15 text-purple-700 dark:text-purple-400",
  "subagent.complete": "bg-indigo-500/15 text-indigo-700 dark:text-indigo-400",
  "context.compact": "bg-gray-500/15 text-gray-700 dark:text-gray-400",
  notification: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
  "file.edit": "bg-cyan-500/15 text-cyan-700 dark:text-cyan-400",
  "human.intervention": "bg-orange-500/15 text-orange-700 dark:text-orange-400",
};

interface Props {
  events: LiveEvent[];
}

export function EventTimeline({ events }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [stickToBottom, setStickToBottom] = useState(true);
  const [search, setSearch] = useState("");

  const { displayedEvents, searchError } = useMemo(() => {
    if (!search) return { displayedEvents: events, searchError: "" };
    try {
      const regex = new RegExp(search, "i");
      const filtered = events.filter((e) => {
        const searchable = `${e.event_type} ${e.source_agent} ${e.session_id} ${e.tool_name ?? ""} ${e.prompt_text ?? ""}`;
        return regex.test(searchable);
      });
      return { displayedEvents: filtered, searchError: "" };
    } catch (err) {
      return {
        displayedEvents: events,
        searchError: `Invalid regex: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  }, [events, search]);

  useEffect(() => {
    if (stickToBottom && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events.length, stickToBottom]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setStickToBottom(scrollHeight - scrollTop - clientHeight < 50);
  };

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="flex flex-1 flex-col rounded-lg border bg-card">
      <div className="border-b p-3">
        <h3 className="mb-2 text-sm font-semibold">Event Stream</h3>
        <Input
          placeholder='Search events (regex)... e.g., "tool.*error"'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 font-mono text-xs"
        />
        {searchError && <p className="mt-1 text-xs text-destructive">{searchError}</p>}
      </div>

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-2"
        style={{ maxHeight: "calc(100vh - 360px)" }}
      >
        {displayedEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <p className="text-sm font-medium">No events to display</p>
            <p className="text-xs">Events will appear here as they arrive</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {displayedEvents.map((event) => (
              <Card key={event.id} className="shadow-none">
                <CardContent className="flex items-start gap-2 p-2">
                  <span className="mt-0.5 whitespace-nowrap font-mono text-[10px] text-muted-foreground">
                    {formatTime(event.timestamp)}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 text-[10px]",
                      EVENT_TYPE_COLORS[event.event_type] ?? "bg-muted text-muted-foreground",
                    )}
                  >
                    {event.event_type}
                  </Badge>
                  <span className="rounded bg-muted px-1 font-mono text-[10px] text-muted-foreground">
                    {event.source_agent}:{event.session_id.slice(0, 8)}
                  </span>
                  {event.tool_name && (
                    <span className="font-mono text-xs font-medium">{event.tool_name}</span>
                  )}
                  {event.model && (
                    <span className="font-mono text-[10px] text-muted-foreground">{event.model}</span>
                  )}
                  {event.latency_ms != null && (
                    <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                      {event.latency_ms}ms
                    </span>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
