import { ArrowRightLeftIcon } from "lucide-react";
import type { ToolPart } from "../../../../utils/tool-helpers";
import { ValenceToolCall } from "../ValenceToolCall";

interface SwitchWorkspaceToolCallProps {
	part: ToolPart;
}

export function SwitchWorkspaceToolCall({
	part,
}: SwitchWorkspaceToolCallProps) {
	return (
		<ValenceToolCall
			part={part}
			toolName="Switch workspace"
			icon={ArrowRightLeftIcon}
		/>
	);
}
