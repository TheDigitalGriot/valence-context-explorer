import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@valence/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { electronTrpc } from "renderer/lib/electron-trpc";
import { CollaborationPanel } from "./components/CollaborationPanel";
import { PromptPreview } from "./components/PromptPreview";
import { VersionTimeline } from "./components/VersionTimeline";
import { VisualEditor } from "./components/VisualEditor";

export const Route = createFileRoute("/_authenticated/_dashboard/prompts/")({
	component: PromptsPage,
});

function PromptsPage() {
	const [selectedId, setSelectedId] = useState<string | null>(null);
	const [draftTemplate, setDraftTemplate] = useState("");

	const utils = electronTrpc.useUtils();
	const { data: prompts = [] } = electronTrpc.prompts.list.useQuery();
	const selected = prompts.find((p) => p.id === selectedId);

	const createMutation = electronTrpc.prompts.create.useMutation({
		onSuccess: (newPrompt) => {
			utils.prompts.list.invalidate();
			setSelectedId(newPrompt.id);
			setDraftTemplate(newPrompt.versions[0]?.template ?? "");
		},
	});

	const updateMutation = electronTrpc.prompts.update.useMutation({
		onSuccess: () => {
			utils.prompts.list.invalidate();
		},
	});

	const deleteMutation = electronTrpc.prompts.delete.useMutation({
		onSuccess: () => {
			utils.prompts.list.invalidate();
			setSelectedId(null);
			setDraftTemplate("");
		},
	});

	const setVersionMutation = electronTrpc.prompts.setActiveVersion.useMutation({
		onSuccess: () => {
			utils.prompts.list.invalidate();
		},
	});

	function handleSelect(id: string) {
		setSelectedId(id);
		const prompt = prompts.find((p) => p.id === id);
		const active = prompt?.versions.find(
			(v) => v.version === prompt.activeVersion,
		);
		setDraftTemplate(active?.template ?? "");
	}

	function handleCreate() {
		createMutation.mutate({
			name: "Untitled Prompt",
			template: "You are a {{role}} assistant.\n\n{{instructions}}",
		});
	}

	function handleSaveVersion() {
		if (!selectedId) return;
		updateMutation.mutate({ id: selectedId, template: draftTemplate });
	}

	return (
		<div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
			<div className="flex items-center justify-between">
				<h1 className="text-lg font-semibold">Prompt CMS</h1>
				<Button size="sm" variant="outline" onClick={handleCreate}>
					<Plus className="mr-1 h-3 w-3" /> New Prompt
				</Button>
			</div>

			{/* Prompt list */}
			{prompts.length > 0 && (
				<div className="flex gap-2 overflow-x-auto pb-1">
					{prompts.map((p) => (
						<button
							key={p.id}
							type="button"
							onClick={() => handleSelect(p.id)}
							className={`shrink-0 rounded-md border px-3 py-1.5 text-sm ${
								p.id === selectedId
									? "border-primary bg-primary/10 font-medium"
									: "hover:bg-muted"
							}`}
						>
							{p.name}
						</button>
					))}
				</div>
			)}

			{selected ? (
				<>
					<VersionTimeline
						versions={selected.versions.map((v) => ({
							version: v.version,
							createdAt: v.createdAt,
							labels: v.labels,
						}))}
						activeVersion={selected.activeVersion}
						onVersionSelect={(version) => {
							setVersionMutation.mutate({ id: selected.id, version });
							const v = selected.versions.find(
								(ver) => ver.version === version,
							);
							if (v) setDraftTemplate(v.template);
						}}
					/>

					<div className="grid grid-cols-[1fr_380px] gap-4">
						<div className="space-y-4">
							<VisualEditor value={draftTemplate} onChange={setDraftTemplate} />
							<div className="flex gap-2">
								<Button size="sm" onClick={handleSaveVersion}>
									Save New Version
								</Button>
								<Button
									size="sm"
									variant="destructive"
									onClick={() => deleteMutation.mutate({ id: selected.id })}
								>
									<Trash2 className="mr-1 h-3 w-3" /> Delete
								</Button>
							</div>
							<PromptPreview template={draftTemplate} />
						</div>
						<CollaborationPanel
							comments={[]}
							changes={selected.versions.map((v) => ({
								id: `v${v.version}`,
								author: "local",
								version: v.version,
								createdAt: v.createdAt,
								description: `Version ${v.version}`,
							}))}
							onAddComment={() => {}}
						/>
					</div>
				</>
			) : (
				<div className="flex flex-1 items-center justify-center text-muted-foreground">
					{prompts.length === 0
						? "No prompts yet. Create one to get started."
						: "Select a prompt to edit."}
				</div>
			)}
		</div>
	);
}
