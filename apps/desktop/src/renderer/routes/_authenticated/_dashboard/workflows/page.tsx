import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@valence/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { electronTrpc } from "renderer/lib/electron-trpc";
import { WorkflowCanvas } from "./components/WorkflowCanvas";

export const Route = createFileRoute("/_authenticated/_dashboard/workflows/")({
	component: WorkflowsPage,
});

function WorkflowsPage() {
	const [selectedId, setSelectedId] = useState<string | null>(null);

	const utils = electronTrpc.useUtils();
	const { data: workflows = [] } = electronTrpc.workflows.list.useQuery();
	const selected = workflows.find((w) => w.id === selectedId);

	const saveMutation = electronTrpc.workflows.save.useMutation({
		onSuccess: (saved) => {
			utils.workflows.list.invalidate();
			setSelectedId(saved.id);
		},
	});

	const deleteMutation = electronTrpc.workflows.delete.useMutation({
		onSuccess: () => {
			utils.workflows.list.invalidate();
			setSelectedId(null);
		},
	});

	function handleCreate() {
		saveMutation.mutate({
			name: "Untitled Workflow",
			nodes: [],
			edges: [],
		});
	}

	return (
		<div className="flex h-full flex-col">
			<div className="flex items-center justify-between border-b px-4 py-2">
				<h1 className="text-lg font-semibold">Workflow Builder</h1>
				<div className="flex gap-2">
					{workflows.map((w) => (
						<button
							key={w.id}
							type="button"
							onClick={() => setSelectedId(w.id)}
							className={`rounded-md border px-2 py-1 text-xs ${
								w.id === selectedId
									? "border-primary bg-primary/10 font-medium"
									: "hover:bg-muted"
							}`}
						>
							{w.name}
						</button>
					))}
					<Button
						size="sm"
						variant="outline"
						className="h-7 text-xs"
						onClick={handleCreate}
					>
						<Plus className="mr-1 h-3 w-3" /> New
					</Button>
					{selectedId && (
						<Button
							size="sm"
							variant="destructive"
							className="h-7 text-xs"
							onClick={() => deleteMutation.mutate({ id: selectedId })}
						>
							<Trash2 className="mr-1 h-3 w-3" /> Delete
						</Button>
					)}
				</div>
			</div>
			<div className="flex-1">
				<WorkflowCanvas
					key={selectedId ?? "empty"}
					initialNodes={selected?.nodes ?? []}
					initialEdges={selected?.edges ?? []}
					onSave={(data) => {
						saveMutation.mutate({
							id: selectedId ?? undefined,
							name: selected?.name ?? "Untitled Workflow",
							nodes: data.nodes.map((n) => ({
								id: n.id,
								type: n.type ?? "step",
								position: n.position,
								data: n.data as Record<string, unknown>,
							})),
							edges: data.edges.map((e) => ({
								id: e.id,
								source: e.source,
								target: e.target,
								type: e.type,
								animated: e.animated,
							})),
						});
					}}
					onRun={(data) => console.log("Run workflow:", data)}
				/>
			</div>
		</div>
	);
}
