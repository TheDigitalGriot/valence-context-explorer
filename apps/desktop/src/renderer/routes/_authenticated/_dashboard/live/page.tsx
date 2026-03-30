import { createFileRoute } from "@tanstack/react-router";
import { useEventStream } from "./components/hooks";
import { useIntervention } from "./components/hooks";
import { AgentSwimLanes } from "./components/AgentSwimLanes";
import { EventTimeline } from "./components/EventTimeline";
import { InterventionPanel } from "./components/InterventionPanel";
import { LivePulseChart } from "./components/LivePulseChart";
import { electronTrpc } from "renderer/lib/electron-trpc";

export const Route = createFileRoute("/_authenticated/_dashboard/live/")({
	component: LiveDashboardPage,
});

function LiveDashboardPage() {
	const { events, filteredEvents, stats, addEvent, clearEvents } = useEventStream();
	const { pending, resolved, handleInterventionEvent, approve, deny, isResponding } = useIntervention();

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
				<button onClick={clearEvents} className="rounded px-2 py-1 text-xs text-muted-foreground hover:bg-muted">
					Clear events
				</button>
			</div>

			<InterventionPanel pending={pending} resolved={resolved} onApprove={approve} onDeny={deny} isResponding={isResponding} />
			<LivePulseChart events={events} stats={stats} />

			<div className="grid flex-1 grid-cols-[1fr_320px] gap-3 overflow-hidden">
				<EventTimeline events={filteredEvents} />
				<AgentSwimLanes events={events} agentIds={stats.uniqueAgentIds} />
			</div>
		</div>
	);
}
