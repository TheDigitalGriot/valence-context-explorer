import { Trash2Icon } from "lucide-react";
import type { ToolPart } from "../../../../utils/tool-helpers";
import { ValenceToolCall } from "../ValenceToolCall";

interface DeleteWorkspaceToolCallProps {
	part: ToolPart;
}

export function DeleteWorkspaceToolCall({
	part,
}: DeleteWorkspaceToolCallProps) {
	return (
		<ValenceToolCall
			part={part}
			toolName="Delete workspace"
			icon={Trash2Icon}
		/>
	);
}
