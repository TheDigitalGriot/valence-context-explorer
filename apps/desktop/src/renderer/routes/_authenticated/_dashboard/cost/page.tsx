import { createFileRoute } from "@tanstack/react-router";
import { AgentCostBreakdown } from "./components/AgentCostBreakdown";
import { DailySpendChart } from "./components/DailySpendChart";
import { SkillCostTable } from "./components/SkillCostTable";

export const Route = createFileRoute("/_authenticated/_dashboard/cost/")({
  component: CostAnalyticsPage,
});

function CostAnalyticsPage() {
  // TODO: Wire to costAnalytics tRPC router when available.
  // For now, render with empty data to establish the route and layout.

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <h1 className="text-lg font-semibold">Cost Analytics</h1>

      <div className="grid grid-cols-2 gap-4">
        <AgentCostBreakdown data={[]} />
        <DailySpendChart data={[]} agentSources={[]} />
      </div>

      <SkillCostTable data={[]} />
    </div>
  );
}
