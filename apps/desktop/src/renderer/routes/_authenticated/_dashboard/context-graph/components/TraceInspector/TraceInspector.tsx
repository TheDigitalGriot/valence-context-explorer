import { Badge } from "@valence/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@valence/ui/card";
import { ScrollArea } from "@valence/ui/scroll-area";
import { NODE_COLORS, type NodeLabel } from "../../../shared/graph-models";

export interface NodeDetails {
	id: string;
	labels: string[];
	properties: Record<string, unknown>;
	connections: Array<{
		type: string;
		direction: "incoming" | "outgoing";
		neighborId: string;
		neighborLabel: string;
		neighborName: string;
	}>;
}

interface TraceInspectorProps {
	nodeDetails: NodeDetails | null;
	onNodeNavigate: (nodeId: string) => void;
}

export function TraceInspector({
	nodeDetails,
	onNodeNavigate,
}: TraceInspectorProps) {
	if (!nodeDetails) {
		return (
			<Card className="h-full">
				<CardContent className="flex h-full items-center justify-center">
					<p className="text-sm text-muted-foreground">
						Select a node to inspect
					</p>
				</CardContent>
			</Card>
		);
	}

	const label = (nodeDetails.labels[0] ?? "Trace") as NodeLabel;
	const color = NODE_COLORS[label] ?? "#6b7280";

	const filteredProperties = Object.entries(nodeDetails.properties).filter(
		([key]) => !key.startsWith("fastRP_") && key !== "project_id",
	);

	const influence = nodeDetails.properties.influence_score as
		| number
		| undefined;
	const communityId = nodeDetails.properties.community_id as number | undefined;

	return (
		<Card className="h-full">
			<CardHeader className="pb-2">
				<div className="flex items-center gap-2">
					<span
						className="inline-block h-3 w-3 rounded-full"
						style={{ backgroundColor: color }}
					/>
					<CardTitle className="text-sm">
						{String(nodeDetails.properties.name ?? nodeDetails.id)}
					</CardTitle>
				</div>
				<div className="flex gap-1">
					{nodeDetails.labels.map((l) => (
						<Badge key={l} variant="outline" className="text-[10px]">
							{l}
						</Badge>
					))}
				</div>
			</CardHeader>
			<CardContent>
				<ScrollArea className="h-[calc(100%-4rem)]">
					{(influence != null || communityId != null) && (
						<div className="mb-3 space-y-1">
							<p className="text-xs font-semibold text-muted-foreground">
								Graph Analytics
							</p>
							{influence != null && (
								<div className="flex justify-between text-xs">
									<span>PageRank (influence)</span>
									<span className="font-mono">{influence.toFixed(4)}</span>
								</div>
							)}
							{communityId != null && (
								<div className="flex justify-between text-xs">
									<span>Community</span>
									<Badge variant="secondary" className="h-4 px-1 text-[10px]">
										#{communityId}
									</Badge>
								</div>
							)}
						</div>
					)}
					<div className="mb-3 space-y-1">
						<p className="text-xs font-semibold text-muted-foreground">
							Properties
						</p>
						{filteredProperties.map(([key, value]) => (
							<div key={key} className="flex justify-between gap-2 text-xs">
								<span className="shrink-0 text-muted-foreground">{key}</span>
								<span className="truncate font-mono">
									{typeof value === "object"
										? JSON.stringify(value)
										: String(value)}
								</span>
							</div>
						))}
					</div>
					{nodeDetails.connections.length > 0 && (
						<div className="space-y-1">
							<p className="text-xs font-semibold text-muted-foreground">
								Connections ({nodeDetails.connections.length})
							</p>
							{nodeDetails.connections.map((conn) => (
								<button
									type="button"
									key={`${conn.type}-${conn.neighborId}`}
									onClick={() => onNodeNavigate(conn.neighborId)}
									className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-left text-xs hover:bg-muted"
								>
									<span className="text-muted-foreground">
										{conn.direction === "incoming" ? "←" : "→"}
									</span>
									<Badge variant="outline" className="text-[10px]">
										{conn.type}
									</Badge>
									<span className="truncate">{conn.neighborName}</span>
								</button>
							))}
						</div>
					)}
				</ScrollArea>
			</CardContent>
		</Card>
	);
}
