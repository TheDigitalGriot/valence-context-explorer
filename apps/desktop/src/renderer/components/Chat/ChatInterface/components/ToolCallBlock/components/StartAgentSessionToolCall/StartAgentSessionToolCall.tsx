import { BotIcon } from "lucide-react";
import type { ToolPart } from "../../../../utils/tool-helpers";
import { ValenceToolCall } from "../ValenceToolCall";

interface StartAgentSessionToolCallProps {
	part: ToolPart;
	toolName?: string;
}

export function StartAgentSessionToolCall({
	part,
	toolName = "Start agent session",
}: StartAgentSessionToolCallProps) {
	return <ValenceToolCall part={part} toolName={toolName} icon={BotIcon} />;
}
