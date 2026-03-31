import { createFileRoute } from "@tanstack/react-router";
import { AgentStatsGrid } from "./components/AgentStatsGrid";
import { EffectivenessChart } from "./components/EffectivenessChart";
import { useComparisonData } from "./components/hooks";

export const Route = createFileRoute("/_authenticated/_dashboard/comparison/")({
	component: ComparisonPage,
});

function ComparisonPage() {
	const { agents, isLoading } = useComparisonData();

	return (
		<div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
			<h1 className="text-lg font-semibold">Agent Effectiveness</h1>

			{isLoading ? (
				<p className="text-sm text-muted-foreground">Loading...</p>
			) : (
				<>
					<EffectivenessChart agents={agents} />
					<AgentStatsGrid agents={agents} />
				</>
			)}
		</div>
	);
}
