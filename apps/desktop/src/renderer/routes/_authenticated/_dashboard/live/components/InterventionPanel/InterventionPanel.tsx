import { Button } from "@valence/ui/button";
import { Badge } from "@valence/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@valence/ui/card";
import { ShieldAlert, Check, X, Clock } from "lucide-react";
import type { PendingIntervention } from "../hooks";

interface Props {
  pending: PendingIntervention[];
  resolved: Array<{ eventId: string; decision: "approve" | "deny"; at: string }>;
  onApprove: (eventId: string) => void;
  onDeny: (eventId: string, reason?: string) => void;
  isResponding: boolean;
}

function formatTimeSince(isoString: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  return `${Math.floor(seconds / 3600)}h ago`;
}

function truncateJson(obj: Record<string, unknown>, maxLen = 200): string {
  const str = JSON.stringify(obj, null, 2);
  return str.length > maxLen ? str.slice(0, maxLen) + "\u2026" : str;
}

export function InterventionPanel({ pending, resolved, onApprove, onDeny, isResponding }: Props) {
  if (pending.length === 0 && resolved.length === 0) return null;

  return (
    <div className="space-y-3">
      {pending.length > 0 && (
        <div className="rounded-lg border-2 border-amber-500/50 bg-amber-50 p-3 dark:bg-amber-950/20">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
            <ShieldAlert className="h-4 w-4" />
            {pending.length} Pending Intervention{pending.length > 1 ? "s" : ""}
          </div>
          <div className="space-y-2">
            {pending.map((item) => (
              <Card key={item.eventId} className="border-amber-300 dark:border-amber-700">
                <CardHeader className="px-4 pb-2 pt-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{item.question}</CardTitle>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="mr-1 h-3 w-3" />
                      {formatTimeSince(item.requestedAt)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <div className="mb-2 space-y-1 text-xs text-muted-foreground">
                    <div>
                      <span className="font-medium">Agent:</span> {item.sourceAgent}:{item.sessionId.slice(0, 8)}
                    </div>
                    <div>
                      <span className="font-medium">Tool:</span>{" "}
                      <code className="rounded bg-muted px-1">{item.toolName}</code>
                    </div>
                    {Object.keys(item.toolInput).length > 0 && (
                      <pre className="mt-1 max-h-24 overflow-auto rounded bg-muted p-2 text-xs">
                        {truncateJson(item.toolInput)}
                      </pre>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      className="h-7 bg-green-600 text-xs hover:bg-green-700"
                      onClick={() => onApprove(item.eventId)}
                      disabled={isResponding}
                    >
                      <Check className="mr-1 h-3 w-3" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="h-7 text-xs"
                      onClick={() => onDeny(item.eventId)}
                      disabled={isResponding}
                    >
                      <X className="mr-1 h-3 w-3" />
                      Deny
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {resolved.length > 0 && (
        <div className="text-xs text-muted-foreground">
          <div className="mb-1 font-medium">Recent decisions:</div>
          {resolved.slice(0, 5).map((r) => (
            <div key={r.eventId} className="flex items-center gap-1">
              {r.decision === "approve" ? (
                <Check className="h-3 w-3 text-green-600" />
              ) : (
                <X className="h-3 w-3 text-red-600" />
              )}
              <span>
                {r.eventId.slice(0, 8)}… {r.decision}d {formatTimeSince(r.at)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
