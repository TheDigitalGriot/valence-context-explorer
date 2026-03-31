import { View, Text, FlatList, RefreshControl } from "react-native";
import { useState, useCallback } from "react";

interface TraceItem {
	id: string;
	project: string;
	sessionCount: number;
	lastActive: string;
}

// Placeholder data — will be wired to tRPC when mobile API bridge is ready
const PLACEHOLDER_TRACES: TraceItem[] = [
	{ id: "1", project: "valence-context-platform", sessionCount: 12, lastActive: "2m ago" },
	{ id: "2", project: "my-web-app", sessionCount: 5, lastActive: "1h ago" },
	{ id: "3", project: "api-server", sessionCount: 3, lastActive: "3h ago" },
];

export function TracesScreen() {
	const [refreshing, setRefreshing] = useState(false);
	const [traces] = useState<TraceItem[]>(PLACEHOLDER_TRACES);

	const onRefresh = useCallback(() => {
		setRefreshing(true);
		setTimeout(() => setRefreshing(false), 1000);
	}, []);

	return (
		<View className="flex-1 bg-background">
			<FlatList
				data={traces}
				keyExtractor={(item) => item.id}
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
				}
				contentContainerStyle={{ padding: 16, gap: 8 }}
				renderItem={({ item }) => (
					<View className="rounded-lg border border-border bg-card p-4">
						<Text className="text-sm font-semibold text-foreground">
							{item.project}
						</Text>
						<View className="mt-1 flex-row items-center gap-3">
							<Text className="text-xs text-muted-foreground">
								{item.sessionCount} sessions
							</Text>
							<Text className="text-xs text-muted-foreground">
								{item.lastActive}
							</Text>
						</View>
					</View>
				)}
				ListEmptyComponent={
					<View className="items-center py-12">
						<Text className="text-sm text-muted-foreground">No traces found</Text>
					</View>
				}
			/>
		</View>
	);
}
