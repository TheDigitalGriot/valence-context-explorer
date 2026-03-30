import { useCallback, useRef, useState } from "react";

export interface PendingIntervention {
  eventId: string;
  traceId: string;
  sourceAgent: string;
  sessionId: string;
  toolName: string;
  toolInput: Record<string, unknown>;
  question: string;
  requestedAt: string;
}

export function useIntervention() {
  const [pending, setPending] = useState<PendingIntervention[]>([]);
  const [resolved, setResolved] = useState<Array<{ eventId: string; decision: "approve" | "deny"; at: string }>>([]);
  const pendingRef = useRef(pending);
  pendingRef.current = pending;
  const [isResponding, setIsResponding] = useState(false);

  const handleInterventionEvent = useCallback((data: Record<string, unknown>) => {
    const intervention = data as unknown as PendingIntervention;
    if (!intervention.eventId || !intervention.toolName) return;
    if (pendingRef.current.some((p) => p.eventId === intervention.eventId)) return;
    setPending((prev) => [intervention, ...prev]);
  }, []);

  const respond = useCallback(async (params: { eventId: string; decision: "approve" | "deny"; reason?: string }) => {
    setIsResponding(true);
    try {
      setPending((prev) => prev.filter((p) => p.eventId !== params.eventId));
      setResolved((prev) => [{ eventId: params.eventId, decision: params.decision, at: new Date().toISOString() }, ...prev.slice(0, 49)]);
    } finally {
      setIsResponding(false);
    }
  }, []);

  const approve = useCallback((eventId: string) => respond({ eventId, decision: "approve" }), [respond]);
  const deny = useCallback((eventId: string, reason?: string) => respond({ eventId, decision: "deny", reason }), [respond]);

  return { pending, resolved, handleInterventionEvent, approve, deny, isResponding };
}
