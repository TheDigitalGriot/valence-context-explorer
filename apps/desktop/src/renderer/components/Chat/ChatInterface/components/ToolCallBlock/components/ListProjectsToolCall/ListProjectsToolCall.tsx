import { FolderKanbanIcon } from "lucide-react";
import type { ToolPart } from "../../../../utils/tool-helpers";
import { ValenceToolCall } from "../ValenceToolCall";

interface ListProjectsToolCallProps {
	part: ToolPart;
}

export function ListProjectsToolCall({ part }: ListProjectsToolCallProps) {
	return (
		<ValenceToolCall
			part={part}
			toolName="List projects"
			icon={FolderKanbanIcon}
		/>
	);
}
