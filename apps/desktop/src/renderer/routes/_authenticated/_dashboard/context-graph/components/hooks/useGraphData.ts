import { useCallback, useMemo, useState } from "react";
import { electronTrpc } from "renderer/lib/electron-trpc";

export interface GraphNode {
  id: string;
  labels: string[];
  properties: Record<string, unknown>;
}

export interface GraphRelationship {
  id: string;
  type: string;
  startNode: string;
  endNode: string;
  properties: Record<string, unknown>;
}

export interface GraphData {
  nodes: GraphNode[];
  relationships: GraphRelationship[];
}

export function useGraphData(params: { sessionId?: string; projectPath?: string }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [nodeTypeFilter, setNodeTypeFilter] = useState<string[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [extraNodes, setExtraNodes] = useState<GraphNode[]>([]);
  const [extraRels, setExtraRels] = useState<GraphRelationship[]>([]);

  const graphQuery = electronTrpc.contextGraph.getGraph.useQuery({
    sessionId: params.sessionId,
    projectPath: params.projectPath,
    limit: 200,
  });

  const searchResult = electronTrpc.contextGraph.search.useQuery(
    { query: searchQuery, limit: 100 },
    { enabled: searchQuery.length > 0 },
  );

  const statsQuery = electronTrpc.contextGraph.getStats.useQuery({});

  const graphData = useMemo<GraphData>(() => {
    const nodeMap = new Map<string, GraphNode>();
    const relMap = new Map<string, GraphRelationship>();

    const baseNodes = (graphQuery.data?.nodes ?? []) as GraphNode[];
    const baseRels = (graphQuery.data?.edges ?? []) as GraphRelationship[];
    const searchNodes = (searchResult.data?.nodes ?? []) as GraphNode[];
    const searchRels = (searchResult.data?.edges ?? []) as GraphRelationship[];

    for (const n of [...baseNodes, ...searchNodes, ...extraNodes]) {
      nodeMap.set(n.id, n);
    }
    for (const r of [...baseRels, ...searchRels, ...extraRels]) {
      relMap.set(r.id, r);
    }

    let nodes = [...nodeMap.values()];
    if (nodeTypeFilter.length > 0) {
      nodes = nodes.filter((n) =>
        n.labels.some((l) => nodeTypeFilter.includes(l)),
      );
    }

    return { nodes, relationships: [...relMap.values()] };
  }, [graphQuery.data, searchResult.data, extraNodes, extraRels, nodeTypeFilter]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setExtraNodes([]);
    setExtraRels([]);
    setExpandedNodes(new Set());
  }, []);

  const expandNode = useCallback(
    async (nodeId: string) => {
      if (expandedNodes.has(nodeId)) return;

      const result = await electronTrpc.contextGraph.expandNode.query({
        nodeId,
        depth: 1,
      });

      const newNodes = (result?.nodes ?? []) as GraphNode[];
      const newRels = (result?.edges ?? []) as GraphRelationship[];

      setExtraNodes((prev) => [...prev, ...newNodes]);
      setExtraRels((prev) => [...prev, ...newRels]);
      setExpandedNodes((prev) => new Set([...prev, nodeId]));
    },
    [expandedNodes],
  );

  return {
    graphData,
    selectedNodeId,
    setSelectedNodeId,
    expandedNodes,
    searchQuery,
    handleSearch,
    nodeTypeFilter,
    setNodeTypeFilter,
    expandNode,
    stats: statsQuery.data,
    isLoading: graphQuery.isLoading,
  };
}
