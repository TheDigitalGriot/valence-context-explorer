import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useCrossAgentData } from "./components/hooks";
import { AgentTimeline } from "./components/AgentTimeline";
import { RepoSessionMap } from "./components/RepoSessionMap";

export const Route = createFileRoute(
	"/_authenticated/_dashboard/cross-agent/",
)({
	component: CrossAgentPage,
});

function CrossAgentPage() {
	const [selectedRepo, setSelectedRepo] = useState<string | null>(null);
	const { repos, totalSessions, totalRepos, isLoading } = useCrossAgentData();

	const selectedRepoData = selectedRepo
		? repos.find((r) => r.repoName === selectedRepo)
		: null;

	return (
		<div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
			<div className="flex items-center justify-between">
				<h1 className="text-lg font-semibold">
					Cross-Agent Correlation
				</h1>
				<div className="flex items-center gap-3 text-xs text-muted-foreground">
					<span>{totalRepos} repos</span>
					<span>{totalSessions} sessions</span>
				</div>
			</div>

			{isLoading ? (
				<p className="text-sm text-muted-foreground">Loading...</p>
			) : (
				<div className="grid grid-cols-[1fr_380px] gap-4">
					<RepoSessionMap
						repos={repos}
						onRepoSelect={setSelectedRepo}
						selectedRepo={selectedRepo}
					/>
					{selectedRepoData ? (
						<AgentTimeline
							sessions={selectedRepoData.sessions}
							repoName={selectedRepoData.repoName}
						/>
					) : (
						<div className="flex items-center justify-center rounded-lg border bg-muted/30 p-8">
							<p className="text-sm text-muted-foreground">
								Select a repository to see the timeline
							</p>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
