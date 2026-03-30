import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  Panel,
  BackgroundVariant,
  type Connection,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@valence/ui/button";
import { Plus, Play, Save, Trash2 } from "lucide-react";
import { StepNode, type StepNodeData } from "../StepNode";
import { ConnectionEdge } from "../ConnectionEdge";
import { StepConfig } from "../StepConfig";

const nodeTypes = { step: StepNode };
const edgeTypes = { connection: ConnectionEdge };

let nodeIdCounter = 0;

function createStepNode(type: StepNodeData["type"], yOffset: number): Node {
  const labels: Record<string, string> = {
    prompt: "New Prompt",
    tool: "New Tool Call",
    condition: "New Condition",
  };

  const data: StepNodeData = {
    label: labels[type] ?? "New Step",
    type,
    ...(type === "prompt" ? { temperature: 0.7 } : {}),
  };

  return {
    id: `step-${++nodeIdCounter}`,
    type: "step",
    position: { x: 250, y: yOffset },
    data,
  };
}

interface Props {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onSave?: (params: { nodes: Node[]; edges: Edge[] }) => void;
  onRun?: (params: { nodes: Node[]; edges: Edge[] }) => void;
}

export function WorkflowCanvas({ initialNodes = [], initialEdges = [], onSave, onRun }: Props) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId),
    [nodes, selectedNodeId],
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) =>
        addEdge({ ...connection, type: "connection", animated: true }, eds),
      );
    },
    [setEdges],
  );

  const handleAddNode = useCallback(
    (type: StepNodeData["type"]) => {
      const node = createStepNode(type, (nodes.length + 1) * 150);
      setNodes((nds) => [...nds, node]);
    },
    [nodes.length, setNodes],
  );

  const handleDeleteSelected = useCallback(() => {
    if (!selectedNodeId) return;
    setNodes((nds) => nds.filter((n) => n.id !== selectedNodeId));
    setEdges((eds) =>
      eds.filter((e) => e.source !== selectedNodeId && e.target !== selectedNodeId),
    );
    setSelectedNodeId(null);
  }, [selectedNodeId, setNodes, setEdges]);

  const handleStepConfigChange = useCallback(
    (partial: Partial<StepNodeData>) => {
      if (!selectedNodeId) return;
      setNodes((nds) =>
        nds.map((n) =>
          n.id === selectedNodeId ? { ...n, data: { ...n.data, ...partial } } : n,
        ),
      );
    },
    [selectedNodeId, setNodes],
  );

  return (
    <div className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => setSelectedNodeId(node.id)}
        onPaneClick={() => setSelectedNodeId(null)}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={0.5} />
        <Controls />
        <MiniMap />

        {/* Add node toolbar */}
        <Panel position="top-left" className="flex gap-1">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleAddNode("prompt")}>
            <Plus className="mr-1 h-3 w-3" /> Prompt
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleAddNode("tool")}>
            <Plus className="mr-1 h-3 w-3" /> Tool
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleAddNode("condition")}>
            <Plus className="mr-1 h-3 w-3" /> Condition
          </Button>
          {selectedNodeId && (
            <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={handleDeleteSelected}>
              <Trash2 className="mr-1 h-3 w-3" /> Delete
            </Button>
          )}
        </Panel>

        {/* Save/Run toolbar */}
        <Panel position="top-right" className="flex gap-1">
          {onSave && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onSave({ nodes, edges })}>
              <Save className="mr-1 h-3 w-3" /> Save
            </Button>
          )}
          {onRun && (
            <Button size="sm" className="h-7 text-xs" onClick={() => onRun({ nodes, edges })}>
              <Play className="mr-1 h-3 w-3" /> Run
            </Button>
          )}
        </Panel>
      </ReactFlow>

      {/* Step config panel */}
      {selectedNode && (
        <div className="absolute bottom-4 right-4 z-10">
          <StepConfig
            data={selectedNode.data as unknown as StepNodeData}
            onChange={handleStepConfigChange}
            onClose={() => setSelectedNodeId(null)}
          />
        </div>
      )}
    </div>
  );
}
