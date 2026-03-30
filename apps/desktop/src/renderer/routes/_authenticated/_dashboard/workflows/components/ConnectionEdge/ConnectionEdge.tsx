import { BaseEdge, getBezierPath, EdgeLabelRenderer, type EdgeProps } from "@xyflow/react";
import { Badge } from "@valence/ui/badge";

export interface ConnectionEdgeData {
  label?: string;
  condition?: string;
  [key: string]: unknown;
}

export function ConnectionEdge({
  id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, selected, data,
}: EdgeProps) {
  const edgeData = data as ConnectionEdgeData | undefined;
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition,
  });

  const displayLabel = edgeData?.condition ?? edgeData?.label;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          strokeWidth: selected ? 2.5 : 1.5,
          stroke: edgeData?.condition
            ? "hsl(var(--chart-4))"
            : "hsl(var(--border))",
        }}
      />
      {displayLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
          >
            <Badge variant="outline" className="bg-background text-[10px]">
              {displayLabel}
            </Badge>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
