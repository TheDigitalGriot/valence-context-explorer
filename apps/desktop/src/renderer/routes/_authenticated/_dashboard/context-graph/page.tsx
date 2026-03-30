import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsList, TabsTrigger } from "@valence/ui/tabs";
import { useState } from "react";
import { electronTrpc } from "renderer/lib/electron-trpc";
import { CommunityAnalysis } from "./components/CommunityAnalysis";
import { GraphSearchPanel } from "./components/GraphSearchPanel";
import { useGraphData } from "./components/hooks";
import { TraceGraph } from "./components/TraceGraph";
import { type NodeDetails, TraceInspector } from "./components/TraceInspector";

export const Route = createFileRoute(
	"/_authenticated/_dashboard/context-graph/",
)({
	component: ContextGraphPage,
});

function ContextGraphPage() {
	const [tab, setTab] = useState<"graph" | "communities">("graph");

	const {
		graphData,
		selectedNodeId,
		setSelectedNodeId,
		expandedNodes,
		searchQuery,
		handleSearch,
		nodeTypeFilter,
		setNodeTypeFilter,
		expandNode,
		stats,
		isLoading,
	} = useGraphData({});

	// Build NodeDetails from the selected node in graphData
	const nodeDetails: NodeDetails | null = selectedNodeId
		? (() => {
				const node = graphData.nodes.find((n) => n.id === selectedNodeId);
				if (!node) return null;
				const connections = graphData.relationships
					.filter(
						(r) =>
							r.startNode === selectedNodeId || r.endNode === selectedNodeId,
					)
					.map((r) => {
						const isOutgoing = r.startNode === selectedNodeId;
						const neighborId = isOutgoing ? r.endNode : r.startNode;
						const neighbor = graphData.nodes.find((n) => n.id === neighborId);
						return {
							type: r.type,
							direction: (isOutgoing ? "outgoing" : "incoming") as
								| "outgoing"
								| "incoming",
							neighborId,
							neighborLabel: neighbor?.labels[0] ?? "Unknown",
							neighborName: String(neighbor?.properties.name ?? neighborId),
						};
					});
				return {
					id: node.id,
					labels: node.labels,
					properties: node.properties,
					connections,
				};
			})()
		: null;

	const communitiesQuery = electronTrpc.contextGraph.getCommunities.useQuery(
		{},
	);

	const statsArray = stats?.nodeCounts;

	return (
		<div className="flex h-full flex-col gap-3 p-4">
			<div className="flex items-center justify-between">
				<h1 className="text-lg font-semibold">Context Graph</h1>
				<Tabs
					value={tab}
					onValueChange={(v) => setTab(v as "graph" | "communities")}
				>
					<TabsList>
						<TabsTrigger value="graph" className="text-xs">
							Graph
						</TabsTrigger>
						<TabsTrigger value="communities" className="text-xs">
							Communities
						</TabsTrigger>
					</TabsList>
				</Tabs>
			</div>

			{tab === "graph" ? (
				<div className="grid flex-1 grid-cols-[260px_1fr_300px] gap-3 overflow-hidden">
					<GraphSearchPanel
						onSearch={handleSearch}
						searchQuery={searchQuery}
						nodeTypeFilter={nodeTypeFilter}
						onNodeTypeFilterChange={setNodeTypeFilter}
						stats={statsArray}
						isLoading={isLoading}
					/>

					<TraceGraph
						nodes={graphData.nodes}
						relationships={graphData.relationships}
						selectedNodeId={selectedNodeId}
						expandedNodes={expandedNodes}
						onNodeClick={setSelectedNodeId}
						onNodeDoubleClick={expandNode}
						height="100%"
					/>

					<TraceInspector
						nodeDetails={nodeDetails}
						onNodeNavigate={setSelectedNodeId}
					/>
				</div>
			) : (
				<CommunityAnalysis
					communities={
						(
							communitiesQuery.data as {
								communities?: Array<{
									communityId: number;
									traceCount: number;
									errorCount: number;
									errorRate: number;
									avgPageRank: number;
									representativeTraces: Array<{
										id: string;
										name: string;
										status?: string;
									}>;
								}>;
							}
						)?.communities ?? []
					}
				/>
			)}
		</div>
	);
}
