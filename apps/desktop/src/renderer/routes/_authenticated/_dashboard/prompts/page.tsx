import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { VisualEditor } from "./components/VisualEditor";
import { PromptPreview } from "./components/PromptPreview";
import { VersionTimeline } from "./components/VersionTimeline";
import { CollaborationPanel } from "./components/CollaborationPanel";

export const Route = createFileRoute("/_authenticated/_dashboard/prompts/")({
  component: PromptsPage,
});

const SAMPLE_TEMPLATE = `You are a {{role}} assistant.

Given the following context:
{{context}}

Please {{task}} and return the result in {{format}} format.`;

function PromptsPage() {
  const [template, setTemplate] = useState(SAMPLE_TEMPLATE);

  // TODO: Wire to prompts tRPC router when available.
  // For now, render with sample data to establish the route and layout.

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
      <h1 className="text-lg font-semibold">Prompt CMS</h1>

      <VersionTimeline
        versions={[
          { version: 1, createdAt: "2026-03-20T10:00:00Z", labels: [] },
          { version: 2, createdAt: "2026-03-25T14:00:00Z", labels: ["production"] },
          { version: 3, createdAt: "2026-03-28T09:00:00Z", labels: ["draft"] },
        ]}
        activeVersion={2}
        onVersionSelect={() => {}}
      />

      <div className="grid grid-cols-[1fr_380px] gap-4">
        <div className="space-y-4">
          <VisualEditor value={template} onChange={setTemplate} />
          <PromptPreview template={template} />
        </div>
        <CollaborationPanel comments={[]} changes={[]} onAddComment={() => {}} />
      </div>
    </div>
  );
}
