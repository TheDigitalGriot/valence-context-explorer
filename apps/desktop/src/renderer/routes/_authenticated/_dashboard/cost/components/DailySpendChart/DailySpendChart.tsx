import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@valence/ui/card";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const COLORS = [
  "hsl(221, 83%, 53%)", "hsl(142, 71%, 45%)", "hsl(280, 67%, 55%)",
  "hsl(24, 94%, 50%)", "hsl(340, 75%, 55%)", "hsl(190, 90%, 40%)",
  "hsl(45, 93%, 47%)",
];

export interface DailySpendEntry {
  date: string;
  [agentSource: string]: string | number;
}

interface Props {
  data: DailySpendEntry[];
  agentSources: string[];
  isLoading?: boolean;
}

export function DailySpendChart({ data, agentSources, isLoading }: Props) {
  const periodTotal = data.reduce((sum, day) => {
    for (const src of agentSources) {
      sum += (day[src] as number) || 0;
    }
    return sum;
  }, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Daily Spend</CardTitle>
        <CardDescription className="text-xs">
          Period total: ${periodTotal.toFixed(2)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading || data.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            {isLoading ? "Loading..." : "No spend data available"}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: number) => `$${v.toFixed(3)}`} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {agentSources.map((src, idx) => (
                <Area
                  key={src}
                  type="monotone"
                  dataKey={src}
                  stackId="spend"
                  stroke={COLORS[idx % COLORS.length]}
                  fill={COLORS[idx % COLORS.length]}
                  fillOpacity={0.4}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
