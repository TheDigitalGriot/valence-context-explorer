import { MonitorSmartphoneIcon } from "lucide-react";
import type { ToolPart } from "../../../../utils/tool-helpers";
import { ValenceToolCall } from "../ValenceToolCall";

interface ListDevicesToolCallProps {
	part: ToolPart;
}

export function ListDevicesToolCall({ part }: ListDevicesToolCallProps) {
	return (
		<ValenceToolCall
			part={part}
			toolName="List devices"
			icon={MonitorSmartphoneIcon}
		/>
	);
}
