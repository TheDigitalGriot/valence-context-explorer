import { Badge } from "@valence/ui/badge";
import { Button } from "@valence/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@valence/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@valence/ui/table";
import { AlertTriangle, Database, Layers, TrendingDown } from "lucide-react";

export interface Community {
  communityId: number;
  traceCount: number;
  errorCount: number;
  errorRate: number;
  avgPageRank: number;
  representativeTraces: Array<{ id: string; name: string; status?: string }>;
}

function ErrorRateBadge({ rate }: { rate: number }) {
  const pct = (rate * 100).toFixed(1);
  if (rate >= 0.5) return <Badge variant="destructive" className="text-[10px]">{pct}%</Badge>;
  if (rate >= 0.2) return <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 text-[10px]">{pct}%</Badge>;
  return <Badge className="bg-green-500/15 text-green-700 dark:text-green-400 text-[10px]">{pct}%</Badge>;
}

interface Props {
  communities: Community[];
  onCreateDataset?: (communityId: number) => void;
}

export function CommunityAnalysis({ communities, onCreateDataset }: Props) {
  const sorted = [...communities].sort((a, b) => b.errorRate - a.errorRate);
  const highErrorCount = communities.filter((c) => c.errorRate >= 0.2).length;
  const totalErrors = communities.reduce((sum, c) => sum + c.errorCount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Community Analysis</CardTitle>
        <CardDescription className="text-xs">Leiden algorithm community detection results</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-md border p-2 text-center">
            <Layers className="mx-auto mb-1 h-4 w-4 text-muted-foreground" />
            <p className="text-lg font-bold">{communities.length}</p>
            <p className="text-[10px] text-muted-foreground">Communities</p>
          </div>
          <div className="rounded-md border p-2 text-center">
            <AlertTriangle className="mx-auto mb-1 h-4 w-4 text-amber-500" />
            <p className="text-lg font-bold">{highErrorCount}</p>
            <p className="text-[10px] text-muted-foreground">High Error Rate</p>
          </div>
          <div className="rounded-md border p-2 text-center">
            <TrendingDown className="mx-auto mb-1 h-4 w-4 text-red-500" />
            <p className="text-lg font-bold">{totalErrors}</p>
            <p className="text-[10px] text-muted-foreground">Total Errors</p>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Community</TableHead>
              <TableHead className="text-xs">Traces</TableHead>
              <TableHead className="text-xs">Error Rate</TableHead>
              <TableHead className="text-xs">Avg PageRank</TableHead>
              <TableHead className="text-xs">Representative</TableHead>
              {onCreateDataset && <TableHead className="text-xs" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((c) => (
              <TableRow key={c.communityId}>
                <TableCell className="font-mono text-xs">#{c.communityId}</TableCell>
                <TableCell className="text-xs">{c.traceCount}</TableCell>
                <TableCell><ErrorRateBadge rate={c.errorRate} /></TableCell>
                <TableCell className="font-mono text-xs">{c.avgPageRank.toFixed(4)}</TableCell>
                <TableCell className="text-xs">
                  {c.representativeTraces.slice(0, 3).map((t) => <span key={t.id} className="mr-1">{t.name}</span>)}
                  {c.representativeTraces.length > 3 && <Badge variant="outline" className="text-[10px]">+{c.representativeTraces.length - 3}</Badge>}
                </TableCell>
                {onCreateDataset && (
                  <TableCell>
                    <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => onCreateDataset(c.communityId)}>
                      <Database className="mr-1 h-3 w-3" />Dataset
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
