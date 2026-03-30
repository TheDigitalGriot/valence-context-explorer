import { Button } from "@valence/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@valence/ui/card";
import { Input } from "@valence/ui/input";
import { ScrollArea } from "@valence/ui/scroll-area";
import { Search, X } from "lucide-react";
import { useState } from "react";
import {
	NODE_COLORS,
	NODE_LABELS,
	type NodeLabel,
} from "../../../shared/graph-models";

interface GraphSearchPanelProps {
	onSearch: (query: string) => void;
	searchQuery: string;
	nodeTypeFilter: string[];
	onNodeTypeFilterChange: (types: string[]) => void;
	stats: Array<{ label: string; count: number }> | undefined;
	isLoading: boolean;
}

export function GraphSearchPanel({
	onSearch,
	searchQuery,
	nodeTypeFilter,
	onNodeTypeFilterChange,
	stats,
	isLoading,
}: GraphSearchPanelProps) {
	const [inputValue, setInputValue] = useState(searchQuery);

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		onSearch(inputValue);
	};

	const toggleFilter = (label: string) => {
		if (nodeTypeFilter.includes(label)) {
			onNodeTypeFilterChange(nodeTypeFilter.filter((t) => t !== label));
		} else {
			onNodeTypeFilterChange([...nodeTypeFilter, label]);
		}
	};

	return (
		<Card className="h-full">
			<CardHeader className="pb-2">
				<CardTitle className="text-sm">Search Graph</CardTitle>
			</CardHeader>
			<CardContent className="space-y-3">
				<form onSubmit={handleSubmit} className="flex gap-1">
					<Input
						placeholder="Search nodes..."
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						className="h-8 text-xs"
					/>
					<Button
						type="submit"
						size="icon"
						variant="outline"
						className="h-8 w-8 shrink-0"
						disabled={isLoading}
					>
						<Search className="h-3.5 w-3.5" />
					</Button>
					{searchQuery && (
						<Button
							type="button"
							size="icon"
							variant="ghost"
							className="h-8 w-8 shrink-0"
							onClick={() => {
								setInputValue("");
								onSearch("");
							}}
						>
							<X className="h-3.5 w-3.5" />
						</Button>
					)}
				</form>
				<div>
					<p className="mb-1.5 text-xs font-semibold text-muted-foreground">
						Filter by type
					</p>
					<div className="flex flex-wrap gap-1">
						{NODE_LABELS.map((label) => {
							const isActive =
								nodeTypeFilter.length === 0 || nodeTypeFilter.includes(label);
							const color = NODE_COLORS[label];
							return (
								<button
									type="button"
									key={label}
									onClick={() => toggleFilter(label)}
									className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium transition-colors hover:bg-muted"
									style={{
										borderColor: isActive ? color : undefined,
										opacity: isActive ? 1 : 0.4,
									}}
								>
									<span
										className="inline-block h-1.5 w-1.5 rounded-full"
										style={{ backgroundColor: color }}
									/>
									{label}
								</button>
							);
						})}
					</div>
				</div>
				{stats && (
					<ScrollArea className="max-h-48">
						<p className="mb-1.5 text-xs font-semibold text-muted-foreground">
							Graph Stats
						</p>
						<div className="space-y-1">
							{stats.map((s) => (
								<div
									key={s.label}
									className="flex items-center justify-between text-xs"
								>
									<div className="flex items-center gap-1.5">
										<span
											className="inline-block h-2 w-2 rounded-full"
											style={{
												backgroundColor:
													NODE_COLORS[s.label as NodeLabel] ?? "#6b7280",
											}}
										/>
										<span>{s.label}</span>
									</div>
									<span className="font-mono text-muted-foreground">
										{s.count}
									</span>
								</div>
							))}
						</div>
					</ScrollArea>
				)}
			</CardContent>
		</Card>
	);
}
