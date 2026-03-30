import { createFileRoute } from "@tanstack/react-router";
import { WorkflowCanvas } from "./components/WorkflowCanvas";

export const Route = createFileRoute("/_authenticated/_dashboard/workflows/")({
  component: WorkflowsPage,
});

function WorkflowsPage() {
  // TODO: Wire to workflows tRPC router for save/load when available.

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <h1 className="text-lg font-semibold">Workflow Builder</h1>
      </div>
      <div className="flex-1">
        <WorkflowCanvas
          onSave={(data) => console.log("Save workflow:", data)}
          onRun={(data) => console.log("Run workflow:", data)}
        />
      </div>
    </div>
  );
}
