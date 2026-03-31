import { View, Text, FlatList } from "react-native";
import { useState, useEffect, useRef } from "react";

interface LiveEventItem {
	id: string;
	type: string;
	agent: string;
	timestamp: string;
	tool?: string;
}

export function LiveScreen() {
	const [events, setEvents] = useState<LiveEventItem[]>([]);
	const idRef = useRef(0);

	// Placeholder — will connect to WebSocket or tRPC subscription
	useEffect(() => {
		const interval = setInterval(() => {
			const types = ["tool.pre", "tool.post", "agent.response", "session.start"];
			const agents = ["Claude Code", "Cursor", "Codex"];
			const tools = ["Read", "Write", "Bash", "Grep", "Edit"];

			setEvents((prev) => {
				const next = [
					{
						id: String(idRef.current++),
						type: types[Math.floor(Math.random() * types.length)],
						agent: agents[Math.floor(Math.random() * agents.length)],
						timestamp: new Date().toLocaleTimeString(),
						tool: Math.random() > 0.5 ? tools[Math.floor(Math.random() * tools.length)] : undefined,
					},
					...prev,
				];
				return next.slice(0, 50);
			});
		}, 2000);

		return () => clearInterval(interval);
	}, []);

	return (
		<View className="flex-1 bg-background">
			<View className="border-b border-border px-4 py-3">
				<Text className="text-xs text-muted-foreground">
					{events.length} events (simulated)
				</Text>
			</View>
			<FlatList
				data={events}
				keyExtractor={(item) => item.id}
				contentContainerStyle={{ padding: 8, gap: 4 }}
				renderItem={({ item }) => (
					<View className="flex-row items-center gap-2 rounded-md border border-border bg-card px-3 py-2">
						<Text className="font-mono text-[10px] text-muted-foreground">
							{item.timestamp}
						</Text>
						<View className="rounded bg-muted px-1.5 py-0.5">
							<Text className="text-[10px] font-medium text-foreground">
								{item.type}
							</Text>
						</View>
						<Text className="text-[10px] text-muted-foreground">{item.agent}</Text>
						{item.tool && (
							<Text className="font-mono text-[10px] font-medium text-foreground">
								{item.tool}
							</Text>
						)}
					</View>
				)}
			/>
		</View>
	);
}
