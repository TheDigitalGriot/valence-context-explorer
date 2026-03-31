import { createFileRoute } from "@tanstack/react-router";
import { electronTrpc } from "renderer/lib/electron-trpc";
import { AgentCostBreakdown } from "./components/AgentCostBreakdown";
import { DailySpendChart } from "./components/DailySpendChart";
import { SkillCostTable } from "./components/SkillCostTable";

export const Route = createFileRoute("/_authenticated/_dashboard/cost/")({
	component: CostAnalyticsPage,
});

function CostAnalyticsPage() {
	const agentCosts = electronTrpc.costAnalytics.getCostByAgent.useQuery({});
	const dailySpend = electronTrpc.costAnalytics.getDailySpend.useQuery({});
	const skillCosts = electronTrpc.costAnalytics.getCostBySkill.useQuery({});

	return (
		<div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
			<h1 className="text-lg font-semibold">Cost Analytics</h1>

			<div className="grid grid-cols-2 gap-4">
				<AgentCostBreakdown
					data={agentCosts.data ?? []}
					isLoading={agentCosts.isLoading}
				/>
				<DailySpendChart
					data={dailySpend.data?.data ?? []}
					agentSources={dailySpend.data?.agentSources ?? []}
					isLoading={dailySpend.isLoading}
				/>
			</div>

			<SkillCostTable
				data={skillCosts.data ?? []}
				isLoading={skillCosts.isLoading}
			/>
		</div>
	);
}
