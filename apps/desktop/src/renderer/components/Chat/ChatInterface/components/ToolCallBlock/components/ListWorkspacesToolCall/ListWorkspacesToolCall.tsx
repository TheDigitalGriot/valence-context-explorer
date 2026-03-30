import { FolderTreeIcon } from "lucide-react";
import type { ToolPart } from "../../../../utils/tool-helpers";
import { ValenceToolCall } from "../ValenceToolCall";

interface ListWorkspacesToolCallProps {
	part: ToolPart;
}

export function ListWorkspacesToolCall({ part }: ListWorkspacesToolCallProps) {
	return (
		<ValenceToolCall
			part={part}
			toolName="List workspaces"
			icon={FolderTreeIcon}
		/>
	);
}
