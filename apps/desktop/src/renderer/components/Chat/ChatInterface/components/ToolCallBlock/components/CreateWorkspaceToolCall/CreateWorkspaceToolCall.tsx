import { FolderPlusIcon } from "lucide-react";
import type { ToolPart } from "../../../../utils/tool-helpers";
import { ValenceToolCall } from "../ValenceToolCall";

interface CreateWorkspaceToolCallProps {
	part: ToolPart;
}

export function CreateWorkspaceToolCall({
	part,
}: CreateWorkspaceToolCallProps) {
	return (
		<ValenceToolCall
			part={part}
			toolName="Create workspace"
			icon={FolderPlusIcon}
		/>
	);
}
