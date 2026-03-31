import { Card, CardContent, CardHeader, CardTitle } from "@valence/ui/card";
import { Badge } from "@valence/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@valence/ui/table";

interface RepoInfo {
	repoName: string;
	repoUrl: string | null;
	agents: string[];
	sessions: Array<{ sessionId: string; agent: string }>;
	totalCost: number;
	totalTokens: number;
}

interface Props {
	repos: RepoInfo[];
	onRepoSelect: (repoName: string) => void;
	selectedRepo: string | null;
}

function formatCost(value: number): string {
	if (value >= 1) return `$${value.toFixed(2)}`;
	if (value >= 0.01) return `$${value.toFixed(3)}`;
	return `$${value.toFixed(4)}`;
}

export function RepoSessionMap({ repos, onRepoSelect, selectedRepo }: Props) {
	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-sm">
					Repositories ({repos.length})
				</CardTitle>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="text-xs">
								Repository
							</TableHead>
							<TableHead className="text-xs">Agents</TableHead>
							<TableHead className="text-xs">Sessions</TableHead>
							<TableHead className="text-xs">Cost</TableHead>
							<TableHead className="text-xs">Tokens</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{repos.map((repo) => (
							<TableRow
								key={repo.repoName}
								className={`cursor-pointer ${selectedRepo === repo.repoName ? "bg-muted" : ""}`}
								onClick={() => onRepoSelect(repo.repoName)}
							>
								<TableCell className="font-mono text-xs">
									{repo.repoName}
								</TableCell>
								<TableCell>
									<div className="flex gap-1">
										{repo.agents.map((a) => (
											<Badge
												key={a}
												variant="secondary"
												className="text-[10px]"
											>
												{a}
											</Badge>
										))}
									</div>
								</TableCell>
								<TableCell className="text-xs">
									{repo.sessions.length}
								</TableCell>
								<TableCell className="font-mono text-xs">
									{formatCost(repo.totalCost)}
								</TableCell>
								<TableCell className="font-mono text-xs">
									{repo.totalTokens.toLocaleString()}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	);
}
