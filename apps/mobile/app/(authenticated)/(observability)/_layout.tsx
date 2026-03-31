import { Tabs } from "expo-router";
import { Activity, DollarSign, List } from "lucide-react-native";

export default function ObservabilityLayout() {
	return (
		<Tabs
			screenOptions={{
				tabBarActiveTintColor: "#3b82f6",
				tabBarLabelStyle: { fontSize: 11 },
			}}
		>
			<Tabs.Screen
				name="traces"
				options={{
					title: "Traces",
					tabBarIcon: ({ color, size }) => <List size={size} color={color} />,
				}}
			/>
			<Tabs.Screen
				name="live"
				options={{
					title: "Live",
					tabBarIcon: ({ color, size }) => <Activity size={size} color={color} />,
				}}
			/>
			<Tabs.Screen
				name="cost"
				options={{
					title: "Cost",
					tabBarIcon: ({ color, size }) => <DollarSign size={size} color={color} />,
				}}
			/>
		</Tabs>
	);
}
