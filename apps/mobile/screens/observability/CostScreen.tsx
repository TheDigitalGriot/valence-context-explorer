import { View, Text, ScrollView } from "react-native";

interface CostCard {
	label: string;
	value: string;
	subtitle: string;
}

const PLACEHOLDER_CARDS: CostCard[] = [
	{ label: "Total Spend", value: "$0.00", subtitle: "Last 30 days" },
	{ label: "Avg Per Session", value: "$0.00", subtitle: "Across all agents" },
	{ label: "Monthly Forecast", value: "$0.00", subtitle: "Based on current usage" },
	{ label: "Active Agents", value: "0", subtitle: "Currently monitored" },
];

export function CostScreen() {
	return (
		<ScrollView className="flex-1 bg-background" contentContainerStyle={{ padding: 16, gap: 12 }}>
			<Text className="text-lg font-semibold text-foreground">Cost Summary</Text>

			<View className="flex-row flex-wrap gap-3">
				{PLACEHOLDER_CARDS.map((card) => (
					<View
						key={card.label}
						className="min-w-[45%] flex-1 rounded-lg border border-border bg-card p-4"
					>
						<Text className="text-xs text-muted-foreground">{card.label}</Text>
						<Text className="mt-1 text-2xl font-bold text-foreground">{card.value}</Text>
						<Text className="mt-0.5 text-[10px] text-muted-foreground">{card.subtitle}</Text>
					</View>
				))}
			</View>

			<View className="mt-4 items-center rounded-lg border border-border bg-muted/30 py-8">
				<Text className="text-sm text-muted-foreground">
					Cost charts will appear when sessions are tracked
				</Text>
			</View>
		</ScrollView>
	);
}
