import { Card, CardContent, CardHeader, CardTitle } from "@valence/ui/card";
import { Badge } from "@valence/ui/badge";
import { ScrollArea } from "@valence/ui/scroll-area";

const AGENT_COLORS: Record<string, string> = {
	"Claude Code": "bg-blue-500",
	Cursor: "bg-purple-500",
	Codex: "bg-green-500",
};

interface TimelineSession {
	sessionId: string;
	agent: string;
	startTime: string;
	costUsd: number;
	tokenCount: number;
	toolCallCount: number;
}

interface Props {
	sessions: TimelineSession[];
	repoName: string;
}

export function AgentTimeline({ sessions, repoName }: Props) {
	const sorted = [...sessions].sort(
		(a, b) =>
			new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
	);

	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-sm">
					Timeline — {repoName}
				</CardTitle>
			</CardHeader>
			<CardContent>
				<ScrollArea className="max-h-[400px]">
					<div className="relative border-l-2 border-border pl-4">
						{sorted.map((session) => {
							const dotColor =
								AGENT_COLORS[session.agent] ?? "bg-gray-500";
							const time = session.startTime
								? new Date(session.startTime).toLocaleString()
								: "Unknown time";

							return (
								<div
									key={session.sessionId}
									className="relative mb-4 pb-2"
								>
									<div
										className={`absolute -left-[1.3rem] top-1 h-2.5 w-2.5 rounded-full ${dotColor}`}
									/>
									<div className="flex items-center gap-2">
										<Badge
											variant="outline"
											className="text-[10px]"
										>
											{session.agent}
										</Badge>
										<span className="text-[10px] text-muted-foreground">
											{time}
										</span>
									</div>
									<div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
										<span className="font-mono">
											{session.tokenCount.toLocaleString()}{" "}
											tokens
										</span>
										<span className="font-mono">
											{session.toolCallCount} tools
										</span>
										{session.costUsd > 0 && (
											<span className="font-mono">
												$
												{session.costUsd < 0.01
													? session.costUsd.toFixed(4)
													: session.costUsd.toFixed(
															2,
														)}
											</span>
										)}
									</div>
								</div>
							);
						})}
						{sorted.length === 0 && (
							<p className="py-4 text-xs text-muted-foreground">
								No sessions found
							</p>
						)}
					</div>
				</ScrollArea>
			</CardContent>
		</Card>
	);
}
