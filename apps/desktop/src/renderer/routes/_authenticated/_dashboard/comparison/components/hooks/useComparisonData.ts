import { electronTrpc } from "renderer/lib/electron-trpc";

export function useComparisonData(params?: { days?: number }) {
	const comparison = electronTrpc.crossAgent.getAgentComparison.useQuery({
		days: params?.days ?? 30,
	});

	return {
		agents: comparison.data ?? [],
		isLoading: comparison.isLoading,
	};
}
