import type NVL from "@neo4j-nvl/base";
import { useEffect, useMemo, useRef, useState } from "react";
import {
	NODE_COLORS,
	NODE_SIZE_MAP,
	type NodeLabel,
} from "../../../shared/graph-models";
import type { GraphNode, GraphRelationship } from "../hooks/useGraphData";

interface TraceGraphProps {
	nodes: GraphNode[];
	relationships: GraphRelationship[];
	selectedNodeId: string | null;
	expandedNodes: Set<string>;
	onNodeClick: (nodeId: string) => void;
	onNodeDoubleClick: (nodeId: string, label: string) => void;
	height?: string;
}

export function TraceGraph({
	nodes,
	relationships,
	selectedNodeId,
	expandedNodes,
	onNodeClick,
	onNodeDoubleClick,
	height = "100%",
}: TraceGraphProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const nvlRef = useRef<NVL | null>(null);
	const cleanupRef = useRef<(() => void) | null>(null);
	const [isReady, setIsReady] = useState(false);

	const nvlNodes = useMemo(
		() =>
			nodes.map((n) => {
				const label = (n.labels[0] ?? "Trace") as NodeLabel;
				const isSelected = n.id === selectedNodeId;
				const isExpanded = expandedNodes.has(n.id);

				return {
					id: n.id,
					size: NODE_SIZE_MAP[label] ?? 25,
					color: isSelected
						? "#ef4444"
						: isExpanded
							? "#22c55e"
							: (NODE_COLORS[label] ?? "#6b7280"),
					caption: String(n.properties.name ?? n.properties.id ?? n.id),
				};
			}),
		[nodes, selectedNodeId, expandedNodes],
	);

	const nvlRelationships = useMemo(
		() =>
			relationships.map((r) => ({
				id: r.id,
				from: r.startNode,
				to: r.endNode,
				caption: r.type,
			})),
		[relationships],
	);

	useEffect(() => {
		let destroyed = false;

		async function init() {
			if (!containerRef.current) return;

			const { default: NVL } = await import("@neo4j-nvl/base");

			if (destroyed) return;

			const instance = new NVL(
				containerRef.current,
				nvlNodes,
				nvlRelationships,
				{
					layout: "d3Force",
					initialZoom: 1.2,
					disableTelemetry: true,
				},
			);

			nvlRef.current = instance;

			// Register click and dblclick via container
			const container = instance.getContainer();

			const handleClick = (evt: MouseEvent) => {
				const { nvlTargets } = instance.getHits(evt, ["node"]);
				const nodeTarget = nvlTargets?.nodes?.[0];
				if (nodeTarget?.data.id) onNodeClick(nodeTarget.data.id);
			};

			const handleDblClick = (evt: MouseEvent) => {
				const { nvlTargets } = instance.getHits(evt, ["node"]);
				const nodeTarget = nvlTargets?.nodes?.[0];
				if (nodeTarget?.data.id) {
					const node = nodes.find((n) => n.id === nodeTarget.data.id);
					const label = node?.labels[0] ?? "Trace";
					onNodeDoubleClick(nodeTarget.data.id, label);
				}
			};

			container.addEventListener("click", handleClick);
			container.addEventListener("dblclick", handleDblClick);

			cleanupRef.current = () => {
				container.removeEventListener("click", handleClick);
				container.removeEventListener("dblclick", handleDblClick);
			};

			setIsReady(true);
		}

		void init();

		return () => {
			destroyed = true;
			cleanupRef.current?.();
			cleanupRef.current = null;
			if (nvlRef.current) {
				nvlRef.current.destroy();
			}
			nvlRef.current = null;
			setIsReady(false);
		};
	}, [nvlNodes, nvlRelationships, nodes, onNodeClick, onNodeDoubleClick]);

	return (
		<div className="relative rounded-lg border bg-card" style={{ height }}>
			<div ref={containerRef} className="h-full w-full" />

			{!isReady && nodes.length > 0 && (
				<div className="absolute inset-0 flex items-center justify-center">
					<p className="text-sm text-muted-foreground">Loading graph...</p>
				</div>
			)}

			{nodes.length === 0 && (
				<div className="absolute inset-0 flex items-center justify-center">
					<p className="text-sm text-muted-foreground">
						No graph data. Search or select a session to populate.
					</p>
				</div>
			)}

			<div className="absolute bottom-2 left-2 flex flex-wrap gap-2 rounded-md bg-background/80 p-2 backdrop-blur-sm">
				{Object.entries(NODE_COLORS).map(([label, color]) => (
					<div key={label} className="flex items-center gap-1">
						<span
							className="inline-block h-2.5 w-2.5 rounded-full"
							style={{ backgroundColor: color }}
						/>
						<span className="text-[10px] text-muted-foreground">{label}</span>
					</div>
				))}
			</div>
		</div>
	);
}
