import { Badge } from "@valence/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@valence/ui/card";

interface AgentStats {
	agent: string;
	sessionCount: number;
	totalCost: number;
	totalTokens: number;
	totalToolCalls: number;
	avgCostPerSession: number;
	avgTokensPerSession: number;
	avgToolCallsPerSession: number;
	repoCount: number;
}

interface Props {
	agents: AgentStats[];
}

function formatCost(value: number): string {
	if (value >= 1) return `$${value.toFixed(2)}`;
	if (value >= 0.01) return `$${value.toFixed(3)}`;
	return `$${value.toFixed(4)}`;
}

export function AgentStatsGrid({ agents }: Props) {
	return (
		<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
			{agents.map((agent) => (
				<Card key={agent.agent}>
					<CardHeader className="pb-2">
						<CardTitle className="flex items-center justify-between text-sm">
							{agent.agent}
							<Badge variant="outline" className="text-[10px]">
								{agent.repoCount} repos
							</Badge>
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-2">
						<div className="grid grid-cols-2 gap-2">
							<div>
								<p className="text-[10px] text-muted-foreground">Sessions</p>
								<p className="text-lg font-bold">{agent.sessionCount}</p>
							</div>
							<div>
								<p className="text-[10px] text-muted-foreground">Total Cost</p>
								<p className="text-lg font-bold">
									{formatCost(agent.totalCost)}
								</p>
							</div>
							<div>
								<p className="text-[10px] text-muted-foreground">
									Avg Cost/Session
								</p>
								<p className="font-mono text-sm">
									{formatCost(agent.avgCostPerSession)}
								</p>
							</div>
							<div>
								<p className="text-[10px] text-muted-foreground">
									Avg Tokens/Session
								</p>
								<p className="font-mono text-sm">
									{Math.round(agent.avgTokensPerSession).toLocaleString()}
								</p>
							</div>
							<div>
								<p className="text-[10px] text-muted-foreground">
									Total Tool Calls
								</p>
								<p className="font-mono text-sm">
									{agent.totalToolCalls.toLocaleString()}
								</p>
							</div>
							<div>
								<p className="text-[10px] text-muted-foreground">
									Avg Tools/Session
								</p>
								<p className="font-mono text-sm">
									{Math.round(agent.avgToolCallsPerSession)}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			))}
			{agents.length === 0 && (
				<div className="col-span-full flex items-center justify-center rounded-lg border bg-muted/30 py-8">
					<p className="text-sm text-muted-foreground">
						No agent data available
					</p>
				</div>
			)}
		</div>
	);
}
