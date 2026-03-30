import { Tooltip, TooltipContent, TooltipTrigger } from "@valence/ui/tooltip";
import { cn } from "@valence/ui/utils";
import { Link, useMatchRoute, useNavigate } from "@tanstack/react-router";
import { Network, Radio, DollarSign, FileText, Workflow } from "lucide-react";
import { LuLayers, LuPlus } from "react-icons/lu";
import {
	STROKE_WIDTH,
	STROKE_WIDTH_THICK,
} from "renderer/screens/main/components/WorkspaceSidebar/constants";
import {
	useEffectiveHotkeysMap,
	useHotkeysStore,
} from "renderer/stores/hotkeys";
import { useOpenNewWorkspaceModal } from "renderer/stores/new-workspace-modal";
import { formatHotkeyText } from "shared/hotkeys";

interface DashboardSidebarHeaderProps {
	isCollapsed?: boolean;
}

export function DashboardSidebarHeader({
	isCollapsed = false,
}: DashboardSidebarHeaderProps) {
	const navigate = useNavigate();
	const matchRoute = useMatchRoute();
	const openModal = useOpenNewWorkspaceModal();
	const platform = useHotkeysStore((state) => state.platform);
	const effective = useEffectiveHotkeysMap();
	const shortcutText = formatHotkeyText(effective.NEW_WORKSPACE, platform);
	const isWorkspacesPageOpen = !!matchRoute({ to: "/v2-workspaces" });

	const handleWorkspacesClick = () => {
		navigate({ to: "/v2-workspaces" });
	};

	if (isCollapsed) {
		return (
			<div className="flex flex-col items-center gap-2 border-b border-border py-2">
				<Tooltip delayDuration={300}>
					<TooltipTrigger asChild>
						<button
							type="button"
							onClick={handleWorkspacesClick}
							className={cn(
								"flex size-8 items-center justify-center rounded-md transition-colors",
								isWorkspacesPageOpen
									? "bg-accent text-foreground"
									: "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
							)}
						>
							<LuLayers className="size-4" strokeWidth={STROKE_WIDTH} />
						</button>
					</TooltipTrigger>
					<TooltipContent side="right">Workspaces</TooltipContent>
				</Tooltip>

				<Tooltip delayDuration={300}>
					<TooltipTrigger asChild>
						<button
							type="button"
							onClick={() => openModal()}
							className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
						>
							<LuPlus className="size-4" strokeWidth={STROKE_WIDTH_THICK} />
						</button>
					</TooltipTrigger>
					<TooltipContent side="right">
						New Workspace ({shortcutText})
					</TooltipContent>
				</Tooltip>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-1 border-b border-border px-2 pt-2 pb-2">
			<button
				type="button"
				onClick={handleWorkspacesClick}
				className={cn(
					"flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors",
					isWorkspacesPageOpen
						? "bg-accent text-foreground"
						: "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
				)}
			>
				<div className="flex size-5 items-center justify-center">
					<LuLayers className="size-4" strokeWidth={STROKE_WIDTH} />
				</div>
				<span className="flex-1 text-left">Workspaces</span>
			</button>

			<button
				type="button"
				onClick={() => openModal()}
				className="group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
			>
				<LuPlus className="size-4 shrink-0" strokeWidth={STROKE_WIDTH_THICK} />
				<span className="flex-1 text-left">New Workspace</span>
				<span
					className={cn(
						"shrink-0 text-[10px] font-mono tabular-nums text-muted-foreground/60",
						"opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100",
					)}
				>
					{shortcutText}
				</span>
			</button>

			<div className="border-t border-border px-3 py-2">
				<p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
					Observability
				</p>
				<nav className="space-y-0.5">
					<Link to="/_authenticated/_dashboard/context-graph" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&.active]:bg-muted [&.active]:text-foreground">
						<Network className="h-3.5 w-3.5" /> Context Graph
					</Link>
					<Link to="/_authenticated/_dashboard/live" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&.active]:bg-muted [&.active]:text-foreground">
						<Radio className="h-3.5 w-3.5" /> Live Dashboard
					</Link>
					<Link to="/_authenticated/_dashboard/cost" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&.active]:bg-muted [&.active]:text-foreground">
						<DollarSign className="h-3.5 w-3.5" /> Cost Analytics
					</Link>
					<Link to="/_authenticated/_dashboard/prompts" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&.active]:bg-muted [&.active]:text-foreground">
						<FileText className="h-3.5 w-3.5" /> Prompts
					</Link>
					<Link to="/_authenticated/_dashboard/workflows" className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [&.active]:bg-muted [&.active]:text-foreground">
						<Workflow className="h-3.5 w-3.5" /> Workflows
					</Link>
				</nav>
			</div>
		</div>
	);
}
