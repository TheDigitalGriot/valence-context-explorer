import { Card, CardContent, CardHeader, CardTitle } from "@valence/ui/card";
import {
	Bar,
	BarChart,
	CartesianGrid,
	Legend,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";

const COLORS = [
	"hsl(221, 83%, 53%)",
	"hsl(280, 67%, 55%)",
	"hsl(142, 71%, 45%)",
	"hsl(24, 94%, 50%)",
];

interface AgentStats {
	agent: string;
	avgCostPerSession: number;
	avgTokensPerSession: number;
	avgToolCallsPerSession: number;
	sessionCount: number;
}

interface Props {
	agents: AgentStats[];
}

export function EffectivenessChart({ agents }: Props) {
	const data = agents.map((a) => ({
		name: a.agent,
		"Avg Cost ($)": Number(a.avgCostPerSession.toFixed(4)),
		"Avg Tokens (K)": Number((a.avgTokensPerSession / 1000).toFixed(1)),
		"Avg Tool Calls": Math.round(a.avgToolCallsPerSession),
		Sessions: a.sessionCount,
	}));

	if (data.length === 0) {
		return (
			<Card>
				<CardContent className="flex h-48 items-center justify-center">
					<p className="text-sm text-muted-foreground">
						No comparison data available
					</p>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader className="pb-2">
				<CardTitle className="text-sm">
					Agent Effectiveness Comparison
				</CardTitle>
			</CardHeader>
			<CardContent>
				<ResponsiveContainer width="100%" height={280}>
					<BarChart data={data} layout="vertical" margin={{ left: 80 }}>
						<CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
						<XAxis type="number" tick={{ fontSize: 10 }} />
						<YAxis
							type="category"
							dataKey="name"
							tick={{ fontSize: 11 }}
							width={80}
						/>
						<Tooltip contentStyle={{ fontSize: 12 }} />
						<Legend wrapperStyle={{ fontSize: 11 }} />
						<Bar dataKey="Avg Cost ($)" fill={COLORS[0]} />
						<Bar dataKey="Avg Tokens (K)" fill={COLORS[1]} />
						<Bar dataKey="Avg Tool Calls" fill={COLORS[2]} />
					</BarChart>
				</ResponsiveContainer>
			</CardContent>
		</Card>
	);
}
