import { useState } from "react";
import { Button } from "@valence/ui/button";
import { Textarea } from "@valence/ui/textarea";
import { Card, CardContent } from "@valence/ui/card";
import { Badge } from "@valence/ui/badge";
import { MessageSquare, Send, Clock } from "lucide-react";

export interface Comment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  lineRef?: number;
}

export interface Change {
  id: string;
  author: string;
  description: string;
  createdAt: string;
  version: number;
}

interface Props {
  comments: Comment[];
  changes: Change[];
  onAddComment: (text: string, lineRef?: number) => void;
}

function formatRelativeTime(isoString: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function CollaborationPanel({ comments, changes, onAddComment }: Props) {
  const [newComment, setNewComment] = useState("");
  const [activeTab, setActiveTab] = useState<"comments" | "changes">("comments");

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    onAddComment(newComment.trim());
    setNewComment("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Card>
      <div className="flex border-b">
        <button
          onClick={() => setActiveTab("comments")}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === "comments" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
          }`}
        >
          <MessageSquare className="mr-1 inline h-3 w-3" />
          Comments ({comments.length})
        </button>
        <button
          onClick={() => setActiveTab("changes")}
          className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
            activeTab === "changes" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"
          }`}
        >
          <Clock className="mr-1 inline h-3 w-3" />
          Changes ({changes.length})
        </button>
      </div>

      <CardContent className="p-3">
        {activeTab === "comments" ? (
          <div className="space-y-3">
            <div className="max-h-60 space-y-2 overflow-y-auto">
              {comments.map((c) => (
                <div key={c.id} className="rounded-md border p-2">
                  <div className="mb-1 flex items-center gap-2 text-xs">
                    <span className="font-medium">{c.author}</span>
                    <span className="text-muted-foreground">{formatRelativeTime(c.createdAt)}</span>
                    {c.lineRef != null && (
                      <Badge variant="outline" className="text-[9px]">
                        Line {c.lineRef}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs">{c.text}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Add a comment..."
                className="min-h-[60px] text-xs"
              />
              <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleSubmit} disabled={!newComment.trim()}>
                <Send className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="max-h-72 space-y-2 overflow-y-auto">
            {changes.map((c) => (
              <div key={c.id} className="flex items-start gap-2 rounded-md border p-2">
                <Badge variant="secondary" className="shrink-0 font-mono text-[10px]">
                  v{c.version}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="text-xs">{c.description}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {c.author} · {formatRelativeTime(c.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
