import { AppWindowIcon } from "lucide-react";
import type { ToolPart } from "../../../../utils/tool-helpers";
import { ValenceToolCall } from "../ValenceToolCall";

interface GetAppContextToolCallProps {
	part: ToolPart;
}

export function GetAppContextToolCall({ part }: GetAppContextToolCallProps) {
	return (
		<ValenceToolCall
			part={part}
			toolName="Get app context"
			icon={AppWindowIcon}
		/>
	);
}
