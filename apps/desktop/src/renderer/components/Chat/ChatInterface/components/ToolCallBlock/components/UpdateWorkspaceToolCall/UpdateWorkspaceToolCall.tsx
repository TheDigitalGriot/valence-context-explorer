import { PencilLineIcon } from "lucide-react";
import type { ToolPart } from "../../../../utils/tool-helpers";
import { ValenceToolCall } from "../ValenceToolCall";

interface UpdateWorkspaceToolCallProps {
	part: ToolPart;
}

export function UpdateWorkspaceToolCall({
	part,
}: UpdateWorkspaceToolCallProps) {
	return (
		<ValenceToolCall
			part={part}
			toolName="Update workspace"
			icon={PencilLineIcon}
		/>
	);
}
