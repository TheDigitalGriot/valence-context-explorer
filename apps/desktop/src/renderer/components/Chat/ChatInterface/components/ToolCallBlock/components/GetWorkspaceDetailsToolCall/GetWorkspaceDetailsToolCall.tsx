import { InfoIcon } from "lucide-react";
import type { ToolPart } from "../../../../utils/tool-helpers";
import { ValenceToolCall } from "../ValenceToolCall";

interface GetWorkspaceDetailsToolCallProps {
	part: ToolPart;
}

export function GetWorkspaceDetailsToolCall({
	part,
}: GetWorkspaceDetailsToolCallProps) {
	return (
		<ValenceToolCall
			part={part}
			toolName="Get workspace details"
			icon={InfoIcon}
		/>
	);
}
