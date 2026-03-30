import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@valence/ui/card";
import {
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
} from "recharts";

const COLORS = [
	"hsl(221, 83%, 53%)",
	"hsl(142, 71%, 45%)",
	"hsl(280, 67%, 55%)",
	"hsl(24, 94%, 50%)",
	"hsl(340, 75%, 55%)",
	"hsl(190, 90%, 40%)",
	"hsl(45, 93%, 47%)",
	"hsl(160, 60%, 45%)",
];

export interface AgentCostEntry {
	agent: string;
	cost: number;
	traceCount: number;
}

interface Props {
	data: AgentCostEntry[];
	isLoading?: boolean;
}

function formatCost(value: number): string {
	if (value >= 1) return `$${value.toFixed(2)}`;
	if (value >= 0.01) return `$${value.toFixed(3)}`;
	return `$${value.toFixed(4)}`;
}

export function AgentCostBreakdown({ data, isLoading }: Props) {
	const totalCost = data.reduce((sum, d) => sum + d.cost, 0);

	return (
		<Card>
			<CardHeader>
				<CardTitle className="text-sm">Cost by Agent</CardTitle>
				<CardDescription className="text-xs">
					Total: {formatCost(totalCost)}
				</CardDescription>
			</CardHeader>
			<CardContent>
				{isLoading || data.length === 0 ? (
					<div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
						{isLoading ? "Loading..." : "No cost data available"}
					</div>
				) : (
					<ResponsiveContainer width="100%" height={240}>
						<PieChart>
							<Pie
								data={data}
								dataKey="cost"
								nameKey="agent"
								cx="50%"
								cy="50%"
								outerRadius={80}
								label={({ agent, percent }) =>
									`${agent} (${(percent * 100).toFixed(0)}%)`
								}
								labelLine={false}
							>
								{data.map((_entry, idx) => (
									// biome-ignore lint/suspicious/noArrayIndexKey: Recharts Cell has no stable id
									<Cell key={idx} fill={COLORS[idx % COLORS.length]} />
								))}
							</Pie>
							<Tooltip
								formatter={(value: number) => formatCost(value)}
								contentStyle={{ fontSize: 12 }}
							/>
							<Legend wrapperStyle={{ fontSize: 11 }} />
						</PieChart>
					</ResponsiveContainer>
				)}
			</CardContent>
		</Card>
	);
}
