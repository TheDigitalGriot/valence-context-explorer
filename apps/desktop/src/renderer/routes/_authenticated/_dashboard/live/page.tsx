import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { electronTrpc } from "renderer/lib/electron-trpc";
import { Tabs, TabsList, TabsTrigger } from "@valence/ui/tabs";
import { useEventStream, useIntervention } from "./components/hooks";
import { AgentSwimLanes } from "./components/AgentSwimLanes";
import { EventTimeline } from "./components/EventTimeline";
import { InterventionPanel } from "./components/InterventionPanel";
import { LivePulseChart } from "./components/LivePulseChart";
import { KanbanBoard } from "./components/KanbanBoard";

export const Route = createFileRoute("/_authenticated/_dashboard/live/")({
	component: LiveDashboardPage,
});

function LiveDashboardPage() {
	const [view, setView] = useState<"stream" | "kanban">("stream");
	const { events, filteredEvents, stats, addEvent, clearEvents } =
		useEventStream();
	const {
		pending,
		resolved,
		handleInterventionEvent,
		approve,
		deny,
		isResponding,
	} = useIntervention();

	// Subscribe to live events via tRPC subscription
	electronTrpc.liveDashboard.watchEvents.useSubscription(undefined, {
		onData: (data) => {
			const eventData = data as Record<string, unknown>;
			if (eventData.event_type === "human.intervention") {
				handleInterventionEvent(eventData);
			} else {
				addEvent(eventData);
			}
		},
	});

	return (
		<div className="flex h-full flex-col gap-3 p-4">
			<div className="flex items-center justify-between">
				<h1 className="text-lg font-semibold">Live Dashboard</h1>
				<div className="flex items-center gap-2">
					<Tabs
						value={view}
						onValueChange={(v) => setView(v as "stream" | "kanban")}
					>
						<TabsList>
							<TabsTrigger value="stream" className="text-xs">
								Stream
							</TabsTrigger>
							<TabsTrigger value="kanban" className="text-xs">
								Kanban
							</TabsTrigger>
						</TabsList>
					</Tabs>
					<button
						type="button"
						onClick={clearEvents}
						className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
					>
						Clear
					</button>
				</div>
			</div>

			<InterventionPanel
				pending={pending}
				resolved={resolved}
				onApprove={approve}
				onDeny={deny}
				isResponding={isResponding}
			/>

			{view === "stream" ? (
				<>
					<LivePulseChart events={events} stats={stats} />
					<div className="grid flex-1 grid-cols-[1fr_320px] gap-3 overflow-hidden">
						<EventTimeline events={filteredEvents} />
						<AgentSwimLanes events={events} agentIds={stats.uniqueAgentIds} />
					</div>
				</>
			) : (
				<div className="flex-1 overflow-hidden">
					<KanbanBoard events={events} />
				</div>
			)}
		</div>
	);
}
