import { electronTrpc } from "renderer/lib/electron-trpc";

export function useCrossAgentData(params?: { days?: number }) {
	const repoData = electronTrpc.crossAgent.getSessionsByRepo.useQuery({
		days: params?.days ?? 30,
	});

	return {
		repos: repoData.data?.repos ?? [],
		totalSessions: repoData.data?.totalSessions ?? 0,
		totalRepos: repoData.data?.totalRepos ?? 0,
		isLoading: repoData.isLoading,
	};
}
