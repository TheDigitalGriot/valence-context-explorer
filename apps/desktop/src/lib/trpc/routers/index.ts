import type { BrowserWindow } from "electron";
import { router } from "..";
import { createAdaptersRouter } from "./adapters";
import { createAnalyticsRouter } from "./analytics";
import { createAuthRouter } from "./auth";
import { createAutoUpdateRouter } from "./auto-update";
import { createBrowserRouter } from "./browser/browser";
import { createBrowserHistoryRouter } from "./browser-history";
import { createCacheRouter } from "./cache";
import { createChangesRouter } from "./changes";
import { createChatRuntimeServiceRouter } from "./chat-runtime-service";
import { createChatServiceRouter } from "./chat-service";
import { createConfigRouter } from "./config";
import { createContextGraphRouter } from "./context-graph";
import { createCostAnalyticsRouter } from "./cost-analytics";
import { createCrossAgentRouter } from "./cross-agent";
import { createEvalsRouter } from "./evals";
import { createExportRouter } from "./export";
import { createExternalRouter } from "./external";
import { createFilesystemRouter } from "./filesystem";
import { createHostServiceManagerRouter } from "./host-service-manager";
import { createHotkeysRouter } from "./hotkeys";
import { createLiveDashboardRouter } from "./live-dashboard";
import { createMcpObservatoryRouter } from "./mcp-observatory";
import { createMenuRouter } from "./menu";
import { createModelProvidersRouter } from "./model-providers";
import { createNotificationsRouter } from "./notifications";
import { createPermissionsRouter } from "./permissions";
import { createPortsRouter } from "./ports";
import { createProjectsRouter } from "./projects";
import { createPromptsRouter } from "./prompts";
import { createResourceMetricsRouter } from "./resource-metrics";
import { createRingtoneRouter } from "./ringtone";
import { createScheduledReportsRouter } from "./scheduled-reports";
import { createSettingsRouter } from "./settings";
import { createTerminalRouter } from "./terminal";
import { createTracesRouter } from "./traces";
import { createUiStateRouter } from "./ui-state";
import { createWindowRouter } from "./window";
import { createWorkflowsRouter } from "./workflows";
import { createWorkspacesRouter } from "./workspaces";

export const createAppRouter = (getWindow: () => BrowserWindow | null) => {
	return router({
		chatRuntimeService: createChatRuntimeServiceRouter(),
		chatService: createChatServiceRouter(),
		analytics: createAnalyticsRouter(),
		browser: createBrowserRouter(),
		browserHistory: createBrowserHistoryRouter(),
		auth: createAuthRouter(),
		autoUpdate: createAutoUpdateRouter(),
		cache: createCacheRouter(),
		modelProviders: createModelProvidersRouter(),
		window: createWindowRouter(getWindow),
		projects: createProjectsRouter(getWindow),
		workspaces: createWorkspacesRouter(),
		terminal: createTerminalRouter(),
		changes: createChangesRouter(),
		filesystem: createFilesystemRouter(),
		notifications: createNotificationsRouter(),
		permissions: createPermissionsRouter(),
		ports: createPortsRouter(),
		resourceMetrics: createResourceMetricsRouter(),
		menu: createMenuRouter(),
		hotkeys: createHotkeysRouter(getWindow),
		external: createExternalRouter(),
		settings: createSettingsRouter(),
		config: createConfigRouter(),
		uiState: createUiStateRouter(),
		ringtone: createRingtoneRouter(getWindow),
		hostServiceManager: createHostServiceManagerRouter(),
		traces: createTracesRouter(),
		costAnalytics: createCostAnalyticsRouter(),
		contextGraph: createContextGraphRouter(),
		liveDashboard: createLiveDashboardRouter(),
		export: createExportRouter(),
		scheduledReports: createScheduledReportsRouter(),
		crossAgent: createCrossAgentRouter(),
		prompts: createPromptsRouter(),
		workflows: createWorkflowsRouter(),
		mcpObservatory: createMcpObservatoryRouter(),
		evals: createEvalsRouter(),
		adapters: createAdaptersRouter(),
	});
};

export type AppRouter = ReturnType<typeof createAppRouter>;
