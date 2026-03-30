import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@valence/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@valence/ui/table";
import { Badge } from "@valence/ui/badge";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";

export interface SkillCostEntry {
  skill: string;
  invocations: number;
  totalCost: number;
  avgCostPerInvocation: number;
  totalTokens: number;
}

type SortKey = "invocations" | "totalCost" | "avgCostPerInvocation";

interface Props {
  data: SkillCostEntry[];
  isLoading?: boolean;
}

function formatCost(value: number): string {
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.01) return `$${value.toFixed(3)}`;
  return `$${value.toFixed(4)}`;
}

function formatTokens(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

export function SkillCostTable({ data, isLoading }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("totalCost");
  const [sortAsc, setSortAsc] = useState(false);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  };

  const sorted = [...data].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey];
    return sortAsc ? diff : -diff;
  });

  const SortIcon = sortAsc ? ArrowUpIcon : ArrowDownIcon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Cost by Tool/Skill</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading || data.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
            {isLoading ? "Loading..." : "No skill cost data"}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Skill</TableHead>
                <TableHead className="cursor-pointer text-xs" onClick={() => handleSort("invocations")}>
                  Calls {sortKey === "invocations" && <SortIcon className="ml-1 inline h-3 w-3" />}
                </TableHead>
                <TableHead className="cursor-pointer text-xs" onClick={() => handleSort("totalCost")}>
                  Total Cost {sortKey === "totalCost" && <SortIcon className="ml-1 inline h-3 w-3" />}
                </TableHead>
                <TableHead className="cursor-pointer text-xs" onClick={() => handleSort("avgCostPerInvocation")}>
                  Avg/Call {sortKey === "avgCostPerInvocation" && <SortIcon className="ml-1 inline h-3 w-3" />}
                </TableHead>
                <TableHead className="text-xs">Tokens</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((entry) => (
                <TableRow key={entry.skill}>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-[10px]">
                      {entry.skill}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{entry.invocations}</TableCell>
                  <TableCell className="font-mono text-xs">{formatCost(entry.totalCost)}</TableCell>
                  <TableCell className="font-mono text-xs">{formatCost(entry.avgCostPerInvocation)}</TableCell>
                  <TableCell className="font-mono text-xs">{formatTokens(entry.totalTokens)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
